---
title: "Memory Layout in C"
description: "the memory layout in c, how variables, functions, etc are saved in memory"
date: "2026-03-31"
tags: ["C", "memory", "system programming"]
category: "Systems Programming"
draft: false
---


# Memory Layout in C
## The Complete Reference for Firmware, Kernel & Systems Engineers

---

## 1. The Big Picture — Process / Firmware Memory Map

Every C program — whether a Linux process, an RTOS task, or a bare-metal firmware image — has its memory divided into well-defined regions. The layout differs slightly between hosted (OS) and freestanding (embedded/bare-metal) environments, but the fundamental segments are the same.

### 1.1 Linux Process Virtual Address Space (x86-64)

```
High address  0xFFFF FFFF FFFF FFFF
┌─────────────────────────────────────┐
│         Kernel Space                │  ← inaccessible from user mode
│   (mapped into every process VAS)   │
├─────────────────────────────────────┤  0xFFFF 8000 0000 0000
│                                     │
│         [ unmapped gap ]            │
│                                     │
├─────────────────────────────────────┤  ~0x7FFF FFFF 0000
│    Stack  (grows ↓)                 │  local vars, return addrs, saved regs
│    ···                              │
│    [ stack guard page ]             │  SIGSEGV on overflow
├─────────────────────────────────────┤
│                                     │
│    mmap region                      │  shared libs, file mappings, mmap()
│    (grows ↓ on most Linux configs)  │
│                                     │
├─────────────────────────────────────┤
│    Heap   (grows ↑)                 │  malloc / new
│    ···                              │
├─────────────────────────────────────┤  program break (brk)
│    BSS    (uninitialised data)      │  zeroed at startup
├─────────────────────────────────────┤
│    Data   (initialised data)        │  global/static with non-zero init
├─────────────────────────────────────┤
│    Text   (code + read-only data)   │  .text, .rodata
├─────────────────────────────────────┤  ~0x0000 0000 0040 0000
│    [ null guard + ELF headers ]     │
Low address   0x0000 0000 0000 0000
```

On a 64-bit Linux system, user space gets the lower 128 TiB; kernel space occupies the upper half. The exact boundaries are controlled by the kernel's `CONFIG_PAGE_OFFSET`.

### 1.2 Bare-Metal / Firmware Memory Map (ARM Cortex-M example)

```
0xFFFF FFFF ┌──────────────────────────────┐
            │  Vendor Peripherals (MMIO)   │  SysTick, NVIC, SCB, MPU
            │  Core Private Peripherals    │
0xE000 0000 ├──────────────────────────────┤
            │  External Device (MMIO)      │  on-chip peripherals: UART,SPI,…
0xA000 0000 ├──────────────────────────────┤
            │  External RAM                │  SDRAM, PSRAM
0x6000 0000 ├──────────────────────────────┤
            │  SRAM (on-chip)              │  .data, .bss, .stack, .heap
0x2000 0000 ├──────────────────────────────┤
            │  Flash / ROM                 │  .text, .rodata, .data (LMA)
0x0000 0000 └──────────────────────────────┘
```

The Cortex-M memory map is architecturally fixed by ARM. MMIO always lives at predictable addresses — this is how bare-metal C accesses hardware with raw pointer casts.

---

## 2. Segments in Detail

### 2.1 `.text` — Code Segment

**What goes here:** Compiled machine code of all functions, plus sometimes jump tables.

**Properties:**
- Read-only at runtime (enforced by MMU/MPU `rx` permission)
- Shared between all processes running the same binary (copy-on-write)
- Mapped from the ELF/binary image directly

**Size:** Fixed at compile time. You can see it with:
```bash
size my_binary
# text    data     bss     dec     hex filename
# 12480     600    2048   15128    3b18 my_binary
```

**Relevant C constructs:**
```c
void foo(void) { ... }          // goes into .text
static void bar(void) { ... }   // also .text, but internal linkage
```

**Firmware note:** On Harvard-architecture MCUs (AVR, some PIC), `.text` is in program memory (Flash) and cannot be read with normal load instructions. You need special macros (`pgm_read_byte`, `PROGMEM`).

---

### 2.2 `.rodata` — Read-Only Data Segment

**What goes here:** String literals, `const` global/static variables, `switch` jump tables, `const` arrays.

```c
const char *msg = "Hello";        // "Hello\0" → .rodata, pointer → .data
const int lookup[] = {1,2,3,4};   // → .rodata
const int x = 42;                 // → .rodata (if truly read-only)
```

**Properties:**
- Same `r--` (no write, no execute) page permissions as `.text` on Linux
- On embedded systems, `.rodata` is often merged into `.text` (both in Flash)
- Writing to `.rodata` is undefined behaviour — may silently succeed on targets with no MMU, or fault with `SIGSEGV`/`BusFault` on protected systems

**Key trap — `const` does not always mean `.rodata`:**
```c
void foo(void) {
    const int x = 42;   // local const → stack, not .rodata
}
```

Local `const` variables live on the stack. Only file-scope and `static` `const` variables with constant initialisers land in `.rodata`.

---

### 2.3 `.data` — Initialised Data Segment

**What goes here:** Global and `static` variables with a non-zero initial value.

```c
int   g_count = 10;          // → .data
char  g_buf[] = "init";      // → .data  (writable copy, not .rodata)
static int s_val = 0xFF;     // → .data
```

**Size:** Contributes to both the binary image size (stores initial values) and runtime memory.

**Firmware detail — LMA vs VMA:**

In embedded systems, `.data` has two addresses:
- **LMA (Load Memory Address):** Where it lives in Flash — the initial values are stored here.
- **VMA (Virtual/Run-time Memory Address):** Where it runs in RAM.

The startup code (`crt0.s` or `startup_stm32.s`) copies `.data` from LMA to VMA before `main()` runs:

```asm
; ARM Cortex-M startup — copy .data from Flash to RAM
    ldr  r0, =_sdata     ; VMA start (RAM)
    ldr  r1, =_edata     ; VMA end   (RAM)
    ldr  r2, =_sidata    ; LMA start (Flash)
copy_data:
    cmp  r0, r1
    bge  zero_bss
    ldr  r3, [r2], #4
    str  r3, [r0], #4
    b    copy_data
```

If you forget this copy (or have a broken linker script), your `.data` variables will start with garbage — a very common early embedded bug.

---

### 2.4 `.bss` — Uninitialised (Zero-Initialised) Data Segment

**What goes here:** Global and `static` variables that are either explicitly zero-initialised or left uninitialised.

```c
int   g_zero;              // → .bss  (implicitly 0 per C standard)
int   g_explicit = 0;      // → .bss  (compiler may optimise to .bss)
static char s_buf[1024];   // → .bss  (1024 bytes, no space in binary!)
```

**Critical property:** `.bss` takes up **zero space in the binary image**. The linker records only the size; the startup code zeroes that region in RAM.

```
Binary on disk:   [ELF header][.text][.rodata][.data]  ← .bss not stored
RAM at runtime:   [.data copy][.bss zeroed region]
```

This is why `size` reports `.bss` separately — it's real RAM, but the binary doesn't bloat.

**Firmware startup zeroing:**
```asm
zero_bss:
    ldr  r0, =_sbss
    ldr  r1, =_ebss
    mov  r2, #0
clear_bss:
    cmp  r0, r1
    bge  start_main
    str  r2, [r0], #4
    b    clear_bss
start_main:
    bl   main
```

**Key rule:** The C standard guarantees that objects with static storage duration (global and `static`) are zero-initialised before any other initialisation. This is implemented by the startup zeroing of `.bss` and the `.data` copy. It is **not** guaranteed for stack or heap allocations.

---

### 2.5 Stack

**What goes here:** Local (automatic) variables, function parameters (spilled from registers), return addresses, saved registers, CPU state on interrupt entry.

```c
void foo(int a, int b) {
    int   local = a + b;    // → stack
    char  buf[64];           // → stack (64 bytes)
    int  *ptr = &local;      // ptr itself on stack, points to stack
}
```

**Growth direction:** Conventionally **downward** (toward lower addresses) on x86, ARM, RISC-V, MIPS. Upward growth is rare (old HP PA-RISC).

**Stack frame layout (x86-64 System V ABI):**
```
Higher address
┌─────────────────────────┐
│  ...previous frame...   │
├─────────────────────────┤  ← caller's RSP before call
│  return address (8 B)   │  ← pushed by CALL instruction
├─────────────────────────┤  ← callee's RBP (saved frame pointer)
│  saved RBP (8 B)        │
├─────────────────────────┤  ← RBP points here
│  local variable 1       │  [RBP - 8]
│  local variable 2       │  [RBP - 16]
│  ...                    │
│  alignment padding      │  RSP must be 16-byte aligned before CALL
├─────────────────────────┤  ← RSP (current stack pointer)
Lower address
```

**Stack sizes:**
| Context              | Typical default size |
|----------------------|----------------------|
| Linux main thread    | 8 MiB (`ulimit -s`)  |
| Linux pthread        | 8 MiB (configurable) |
| Linux kernel thread  | 8 KiB (x86-64)       |
| FreeRTOS task        | Configured per task  |
| ARM Cortex-M MSP     | Defined in vector table |

**Overflow:** Stack overflow on Linux triggers a `SIGSEGV` from the guard page. On bare-metal without an MPU, it silently corrupts adjacent memory — the `_estack` linker symbol check and `__stack_chk_fail` canary exist for this reason.

**Stack canaries (GCC `-fstack-protector`):**
```c
void vulnerable(char *input) {
    char buf[16];
    // GCC inserts:
    // 1. Load random canary from TLS onto stack between buf and return addr
    // 2. On return: check canary == original; if not → __stack_chk_fail()
    strcpy(buf, input);   // overflow would corrupt canary before return addr
}
```

**Firmware tip:** On Cortex-M you have two stacks:
- **MSP (Main Stack Pointer):** Used in Thread mode before RTOS starts, and in all exception handlers.
- **PSP (Process Stack Pointer):** Used by RTOS tasks. Separating them means a task stack overflow does not corrupt the interrupt handler stack.

---

### 2.6 Heap

**What goes here:** Dynamically allocated memory from `malloc`/`calloc`/`realloc`/`free` (or `new`/`delete` in C++).

```c
void *p  = malloc(256);      // heap allocation
char *s  = strdup("hello");  // heap (uses malloc internally)
free(p);                     // returns to heap allocator
```

**How it works on Linux:**
- Small allocations: `malloc` uses `brk()`/`sbrk()` to extend the heap upward.
- Large allocations (≥ `MMAP_THRESHOLD`, default 128 KiB): `malloc` uses `mmap()` — these are independent and returned to the OS on `free()`.
- `glibc malloc` maintains per-arena free lists (bins) to reuse memory without syscalls.

**Heap on bare-metal:**
- No OS — the heap is a linker-defined region between `.bss` end and stack bottom.
- `newlib` implements `malloc` on top of a `_sbrk()` syscall you must provide.
- Many safety-critical firmware standards (MISRA-C, DO-178C) forbid dynamic allocation after init.

**Common heap bugs:**
```c
// Use-after-free
char *p = malloc(10);
free(p);
*p = 'X';          // UB — may corrupt allocator metadata

// Double-free
free(p);
free(p);           // UB — corrupts allocator free list

// Buffer overflow into heap metadata
char *p = malloc(4);
p[4] = 0xFF;       // writes into allocator chunk header

// Leak
void leak(void) {
    void *p = malloc(100);
    return;        // p never freed — lost forever
}
```

**Detection tools:**
```bash
valgrind --leak-check=full ./binary
address sanitizer: gcc -fsanitize=address -g ./binary
```

---

### 2.7 Memory-Mapped I/O (MMIO)

Not a segment in the ELF sense — MMIO is a region of the physical address space where reads and writes go to hardware registers rather than RAM.

```c
// ARM Cortex-M: GPIOA base address
#define GPIOA_BASE   0x48000000UL
#define GPIOA_MODER  (*(volatile uint32_t *)(GPIOA_BASE + 0x00))
#define GPIOA_ODR    (*(volatile uint32_t *)(GPIOA_BASE + 0x14))

// Set PA5 as output, then drive it high
GPIOA_MODER = (GPIOA_MODER & ~(3U << 10)) | (1U << 10);
GPIOA_ODR  |= (1U << 5);
```

The `volatile` keyword is **mandatory** for MMIO — see Section 4.

---

## 3. Storage Classes

### 3.1 `auto` — Automatic (Stack)

The default for local variables. Almost never written explicitly.

```c
void foo(void) {
    auto int x = 5;   // identical to: int x = 5;
}
```

Lifetime: from declaration to end of enclosing scope. Storage: stack (or CPU register if optimised).

---

### 3.2 `register` — Hint for Register Allocation

Historical hint to the compiler. **Ignored by all modern compilers** — they do their own register allocation (far better than any human hint). The only lasting effect: you cannot take the address of a `register` variable.

```c
register int i = 0;   // compiler ignores the hint
// &i;               // compile error — no address of register var
```

**Verdict for systems code:** Never use. A relic.

---

### 3.3 `static` — The Most Overloaded Keyword in C

`static` has **three distinct meanings** depending on context:

#### 3.3.1 `static` at file scope — Internal Linkage

```c
// file: module.c
static int counter = 0;       // NOT visible outside this translation unit
static void helper(void) {}   // NOT visible outside this translation unit

int public_api(void) {
    return ++counter;
}
```

**Why this matters for systems engineers:**
- Prevents symbol collisions in large codebases (two `.c` files can each have their own `static int counter`).
- Signals "module-private" — equivalent to `private` in OOP.
- The linker will not export these symbols (they won't appear in the dynamic symbol table).
- Enables whole-program optimisation: the compiler knows no other TU calls `helper`, so it can inline/eliminate it freely.

#### 3.3.2 `static` on local variables — Persistent Storage

```c
void count_calls(void) {
    static int n = 0;   // initialised once, persists across calls
    n++;
    printf("called %d times\n", n);
}
```

**Memory location:** `.data` (if `n != 0`) or `.bss` (if `n == 0`). Not the stack.
**Initialiser:** Evaluated exactly once, before `main()`. Thread-safety in C11: guaranteed only for the initialisation of block-scope `static` — the increment itself is not atomic.

**Firmware use case — debounce state machine:**
```c
bool button_debounced(bool raw) {
    static uint32_t last_tick = 0;
    static bool     last_state = false;
    uint32_t now = get_tick_ms();
    if (raw != last_state && (now - last_tick) > 20) {
        last_state = raw;
        last_tick  = now;
    }
    return last_state;
}
```

**Thread-safety warning:** A `static` local is shared state. In a multi-threaded or preemptive RTOS environment, protect it with a mutex or use `_Atomic`.

#### 3.3.3 `static` in function parameters — Array Minimum Size Hint

```c
void process(int arr[static 8]) {
    // Compiler-guaranteed: arr points to at least 8 ints
    // Enables auto-vectorisation without bounds checks
}
```

This is a C99 feature. The `static` here is not a storage class — it's a minimum-size contract for the pointer, enabling optimiser hints. Passing a shorter array is UB.

---

### 3.4 `extern` — External Linkage Declaration

Declares that the definition lives in another translation unit:

```c
// file: shared.h
extern int g_system_tick;       // declaration — no storage allocated
extern void platform_init(void);

// file: platform.c
int g_system_tick = 0;          // definition — storage allocated here
```

**Kernel/firmware pattern — linker-defined symbols:**
```c
// Linker script defines these symbols
extern uint32_t _sdata;   // start of .data VMA
extern uint32_t _edata;   // end   of .data VMA
extern uint32_t _sidata;  // start of .data LMA (in Flash)
extern uint32_t _sbss;
extern uint32_t _ebss;
extern uint32_t _estack;  // top of stack

// Startup code uses them as addresses:
memcpy(&_sdata, &_sidata, (size_t)(&_edata - &_sdata) * sizeof(uint32_t));
```

---

## 4. `volatile` — The Most Misunderstood Keyword

`volatile` tells the compiler: **"do not optimise accesses to this variable — every read must go to memory, every write must go to memory, in program order."**

It does **not** provide atomicity, memory ordering, or thread-safety. It is not a synchronisation primitive.

### 4.1 Why `volatile` Exists — The Compiler's View

Without `volatile`, the compiler assumes memory is a simple deterministic store — reading the same address twice with no intervening write will return the same value, so it can eliminate the second read. This is wrong for:

1. **Hardware registers** that change on their own (status registers, FIFO data, timer counters)
2. **Variables modified by ISRs** (interrupt service routines)
3. **Variables modified by other CPU cores** (without proper atomics — though `volatile` alone is insufficient here)
4. **`setjmp`/`longjmp`** — variables modified between setjmp and longjmp must be `volatile` to survive

```c
// Without volatile — compiler may generate:
//   load R0, [status_addr]
//   loop: cmp R0, #0  ← reads register once, loops forever or never
//          bne loop

// With volatile — compiler generates:
//   loop: load R0, [status_addr]  ← reads hardware register every iteration
//          cmp R0, #0
//          bne loop

volatile uint32_t *STATUS = (volatile uint32_t *)0x40000004UL;
while (*STATUS & 0x1) { /* wait for ready */ }
```

### 4.2 `volatile` and MMIO — The Correct Pattern

```c
// WRONG — missing volatile on register access
#define RCC_CR   (*(uint32_t *)0x40023800UL)   // no volatile!

// CORRECT
#define RCC_CR   (*(volatile uint32_t *)0x40023800UL)

// Even better — define register structs
typedef struct {
    volatile uint32_t CR;      // offset 0x00
    volatile uint32_t PLLCFGR; // offset 0x04
    volatile uint32_t CFGR;    // offset 0x08
    volatile uint32_t CIR;     // offset 0x0C
} RCC_TypeDef;

#define RCC ((RCC_TypeDef *)0x40023800UL)

RCC->CR |= (1U << 16);   // enable HSE — compiler cannot cache this
```

### 4.3 `volatile` and ISRs

```c
volatile bool g_flag = false;   // modified in ISR, read in main loop

void EXTI0_IRQHandler(void) {
    g_flag = true;              // ISR sets flag
}

int main(void) {
    while (!g_flag) {           // main loop polls flag
        // without volatile, compiler hoists the load out of loop → infinite loop
    }
    handle_event();
}
```

**On single-core ARM Cortex-M:** `volatile` alone is sufficient for ISR-to-main communication, because:
- Only one core — no cache coherency issue
- ARM guarantees that the ISR executes to completion before returning (no reordering across interrupt boundaries at the hardware level)
- But you still need `volatile` to prevent the compiler from caching the variable in a register

### 4.4 `volatile` is NOT Enough for SMP / Multi-Core

On a multi-core system, `volatile` prevents compiler optimisation but does not prevent:
- CPU out-of-order execution
- Cache coherency races
- Store buffer delays

For shared state between cores use **C11 atomics** or kernel synchronisation primitives:

```c
#include <stdatomic.h>

atomic_bool g_flag = false;          // C11 atomic

// Thread / core 0:
atomic_store(&g_flag, true);         // release store

// Thread / core 1:
while (!atomic_load(&g_flag)) {}     // acquire load
// guaranteed to see all writes from core 0 that preceded the store
```

### 4.5 `volatile` and `const` Together

The combination `const volatile` is common for read-only hardware registers:

```c
// Read-only status register — we can read it, hardware changes it, we cannot write it
const volatile uint32_t *RO_STATUS = (const volatile uint32_t *)0x40000008UL;

uint32_t s = *RO_STATUS;   // valid: read
*RO_STATUS = 0;            // compile error: assignment to const
```

### 4.6 `volatile` Pitfalls

```c
volatile int x = 0;

// PITFALL 1: read-modify-write is NOT atomic
x++;   // compiles to: load x; add 1; store x — three non-atomic steps

// PITFALL 2: volatile struct access — only member access is volatile, not the whole struct
volatile struct { int a; int b; } s;
s.a = 1;   // volatile write to s.a ✓
int tmp = s;  // ERROR — copying whole struct may not be volatile

// PITFALL 3: volatile pointer vs pointer to volatile
volatile int *p;    // pointer to volatile int — what you usually want for MMIO
int * volatile p2;  // volatile pointer to int — pointer itself is volatile, not the int
```

### 4.7 `volatile` Summary Table

| Use case                         | `volatile` needed? | Notes |
|----------------------------------|--------------------|-------|
| MMIO register access             | **Yes**            | Always |
| ISR ↔ main loop flag (single core)| **Yes**           | Sufficient on Cortex-M |
| ISR ↔ main loop flag (SMP)       | No, use atomics    | `volatile` insufficient |
| Thread-shared variable           | No, use atomics    | `volatile` is not a sync primitive |
| `setjmp`/`longjmp` survivors     | **Yes**            | C standard requirement |
| `sleep()`/`pause()` busy-wait    | **Yes**            | Prevent optimisation of delay loops |
| DMA buffer                       | **Yes** (sometimes)| Depends on cache architecture |

---

## 5. `const` — Immutability and Placement

```c
const int x = 42;               // → .rodata (file scope)
const char msg[] = "hello";     // → .rodata

void foo(void) {
    const int y = 10;            // → stack (local const)
    const int *p = &x;           // pointer to const int — can't write *p
    int * const q = &some_int;   // const pointer to int — can't change q
    const int * const r = &x;    // both const
}
```

**Pointer to `const` vs `const` pointer:**
```c
const int *p;     // *p is read-only, p itself can change (common for string args)
int *const p;     // p cannot change, *p is writable (rare)
const int *const p; // neither can change
```

**Firmware: `const` data in Flash**

On embedded systems, `const` at file scope is the only way to keep data in Flash (no RAM wasted):

```c
// Stored in Flash (.rodata section in linker script)
const uint8_t font_data[256][8] = { ... };   // 2 KiB in Flash, 0 bytes in RAM
const uint16_t crc_table[256]   = { ... };   // 512 bytes in Flash
```

Without `const`, the compiler puts it in `.data` → LMA in Flash, VMA in RAM → wastes RAM.

---

## 6. `register` Sizes and Type Sizes

### 6.1 Fundamental Type Sizes

The C standard gives *minimum* sizes; the platform ABI pins the exact sizes:

| Type            | C standard minimum | x86-64 Linux/Windows | ARM Cortex-M (32-bit) |
|-----------------|--------------------|----------------------|------------------------|
| `char`          | 8 bits             | 8 bits               | 8 bits                 |
| `short`         | 16 bits            | 16 bits              | 16 bits                |
| `int`           | 16 bits            | **32 bits**          | **32 bits**            |
| `long`          | 32 bits            | **64 bits** (Linux)  | **32 bits**            |
| `long long`     | 64 bits            | 64 bits              | 64 bits                |
| `pointer`       | —                  | 64 bits              | 32 bits                |
| `size_t`        | —                  | 64 bits              | 32 bits                |

`long` being 32 bits on Windows 64-bit and 64 bits on Linux 64-bit is the classic portability trap. **Use `<stdint.h>` fixed-width types for all systems code:**

```c
#include <stdint.h>
#include <stddef.h>

uint8_t  u8  = 0xFF;
int16_t  i16 = -1000;
uint32_t u32 = 0xDEADBEEF;
uint64_t u64 = 0xCAFEBABE00000000ULL;
uintptr_t p  = (uintptr_t)some_ptr;   // integer wide enough for a pointer
size_t    sz = sizeof(some_array);
ptrdiff_t d  = ptr2 - ptr1;           // pointer difference
```

### 6.2 `sizeof` Quick Reference

```c
sizeof(char)         == 1           // always, by definition
sizeof(short)        == 2
sizeof(int)          == 4
sizeof(long)         == 4 or 8      // platform-dependent!
sizeof(long long)    == 8
sizeof(float)        == 4
sizeof(double)       == 8
sizeof(void *)       == 4 or 8      // 4 on 32-bit, 8 on 64-bit
sizeof(size_t)       == sizeof(void *)
```

---

## 7. Linker Scripts — The Glue Between Code and Memory

The linker script defines where each segment lands in the final binary and in memory. Every embedded project needs one; Linux programs use a default script built into `ld`.

### 7.1 Anatomy of a Minimal Linker Script (ARM Cortex-M)

```ld
/* Memory regions */
MEMORY {
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 512K
    SRAM  (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
}

/* Section placement */
SECTIONS {
    /* Vector table + code → Flash */
    .text : {
        KEEP(*(.isr_vector))    /* interrupt vector table MUST be first */
        *(.text)
        *(.text.*)
        *(.rodata)
        *(.rodata.*)
        . = ALIGN(4);
        _etext = .;             /* symbol: end of Flash image */
    } > FLASH

    /* Initialised data: LMA=Flash, VMA=SRAM */
    _sidata = LOADADDR(.data);  /* LMA — where initial values are stored */
    .data : AT(_sidata) {
        _sdata = .;
        *(.data)
        *(.data.*)
        . = ALIGN(4);
        _edata = .;
    } > SRAM

    /* Zero-initialised data → SRAM (no Flash space consumed) */
    .bss : {
        _sbss = .;
        *(.bss)
        *(.bss.*)
        *(COMMON)
        . = ALIGN(4);
        _ebss = .;
    } > SRAM

    /* Heap → SRAM after BSS */
    .heap : {
        _heap_start = .;
        . = . + 0x4000;         /* 16 KiB heap */
        _heap_end   = .;
    } > SRAM

    /* Stack → top of SRAM (grows down) */
    _estack = ORIGIN(SRAM) + LENGTH(SRAM);
}
```

### 7.2 Placing Code/Data in Specific Sections

```c
// Place in a custom section (e.g., execute from SRAM for flash-write routines)
__attribute__((section(".ramfunc")))
void flash_erase_sector(uint32_t sector) { ... }

// Place in a specific named section
__attribute__((section(".isr_vector")))
const uint32_t vector_table[] = {
    (uint32_t)&_estack,           // initial MSP
    (uint32_t)Reset_Handler,      // reset vector
    (uint32_t)NMI_Handler,
    (uint32_t)HardFault_Handler,
    // ...
};

// Keep symbol even if unused (prevent linker GC)
__attribute__((used))
__attribute__((section(".build_id")))
static const char build_id[] = GIT_HASH;
```

### 7.3 Checking Section Placement

```bash
# Show all sections and their sizes
arm-none-eabi-size --format=sysv firmware.elf

# Show symbol addresses and sections
arm-none-eabi-nm --print-size --size-sort firmware.elf

# Disassemble with source
arm-none-eabi-objdump -d -S firmware.elf | less

# Detailed map file (add to linker flags: -Wl,-Map=firmware.map)
grep "\.data\|\.bss\|\.text" firmware.map
```

---

## 8. Memory Qualifiers for Embedded — `__attribute__` Reference

| Attribute                            | Effect |
|--------------------------------------|--------|
| `__attribute__((aligned(N)))`        | Force N-byte alignment |
| `__attribute__((packed))`            | Remove padding |
| `__attribute__((section("name")))`   | Place in named linker section |
| `__attribute__((used))`              | Prevent linker GC |
| `__attribute__((unused))`            | Suppress unused warning |
| `__attribute__((noinline))`          | Prevent inlining (useful for profiling) |
| `__attribute__((always_inline))`     | Force inline |
| `__attribute__((noreturn))`          | Function never returns (like `abort()`) |
| `__attribute__((weak))`              | Weak symbol — overrideable by strong definition |
| `__attribute__((alias("name")))`     | Alias for another symbol |
| `__attribute__((visibility("hidden")))`| Hide from dynamic linker |
| `__attribute__((constructor))`       | Run before `main()` |
| `__attribute__((destructor))`        | Run after `main()` / `exit()` |

**Weak symbols — the HAL override pattern:**
```c
// In BSP library — default (do-nothing) implementation
__attribute__((weak))
void board_early_init(void) { }   // user can override in their application

// In user application — strong definition overrides the weak one
void board_early_init(void) {
    configure_clocks();
    configure_pins();
}
```

---

## 9. Stack vs Heap vs Static — Decision Guide

```
Need this data to...                       Use...
────────────────────────────────────────────────────────────────────
Exist only inside this function call    →  Stack (local variable)
Persist across function calls,           →  static local variable
  accessed only by one function
Persist for program lifetime,            →  Global variable (.data/.bss)
  accessed by multiple functions
Have a size known only at runtime        →  Heap (malloc)
  and freed later
Be a hardware register                   →  MMIO (volatile pointer)
Be read-only configuration data          →  const global (.rodata/Flash)
────────────────────────────────────────────────────────────────────
```

---

## 10. Common Memory Bugs and Detection

### 10.1 Stack Overflow

```c
void bad(void) {
    char buf[1024 * 1024];   // 1 MiB on stack → likely overflow
    memset(buf, 0, sizeof buf);
}
```

Detection on Linux: `ulimit -s unlimited` + AddressSanitizer `-fsanitize=address`
Detection on Cortex-M: MPU region on stack bottom, or fill stack with `0xDEADBEEF` and check watermark:
```c
// At startup: fill stack region with canary
memset(&_sbss_end, 0xAB, STACK_SIZE);

// Later: check how deep the stack was used
uint32_t *p = (uint32_t *)STACK_BOTTOM;
while (*p == 0xABABABAB) p++;
printf("Stack used: %u bytes\n", (uint32_t)(STACK_TOP - (uintptr_t)p));
```

### 10.2 Dangling Pointer

```c
int *get_local(void) {
    int x = 42;
    return &x;   // x is on stack — gone after return!
}
// Dereferencing the returned pointer is UB
```

### 10.3 Buffer Overflow

```c
char buf[8];
strcpy(buf, "this string is too long");  // overflows into adjacent stack frames
```

Enable: `-fstack-protector-strong -D_FORTIFY_SOURCE=2`

### 10.4 Memory Leak

```c
void process(void) {
    uint8_t *buf = malloc(256);
    if (error_condition) return;   // leak! forgot to free before early return
    // ...
    free(buf);
}
```

Pattern to avoid: Use `goto cleanup` for early returns with cleanup:
```c
void process(void) {
    int ret = 0;
    uint8_t *buf = malloc(256);
    if (!buf) return -ENOMEM;

    if (error_condition) { ret = -EINVAL; goto out; }

    // ...main logic...

out:
    free(buf);
    return ret;
}
```

### 10.5 Unaligned Access

```c
uint8_t buf[5];
uint32_t *p = (uint32_t *)(buf + 1);   // misaligned!
uint32_t v  = *p;   // UB — bus fault on Cortex-M0/M0+, slow on x86
```

Safe alternative:
```c
uint32_t v;
memcpy(&v, buf + 1, sizeof v);   // compiler generates appropriate load instructions
```

---

## 11. Virtual Memory — Linux Kernel Perspective

### 11.1 Page Tables and TLB

Linux manages memory in **pages** (4 KiB on x86-64, configurable). Each process has its own page table — a mapping from virtual addresses (what your code sees) to physical addresses (what the RAM chips see).

```
Virtual Address → [Page Table Walk] → Physical Address

VA bits breakdown (x86-64, 4-level paging):
 63      48 47    39 38    30 29    21 20    12 11      0
[sign extend][PML4  ][PDPT   ][PD     ][PT     ][Page offset]
```

A **TLB miss** triggers a page table walk, which is expensive (~100 cycles). This is why huge pages (2 MiB, 1 GiB) matter for memory-intensive code — fewer TLB entries needed.

### 11.2 `mmap` — Direct Memory Mapping

```c
#include <sys/mman.h>

// Map a file into virtual address space
void *addr = mmap(NULL, length, PROT_READ | PROT_WRITE,
                  MAP_SHARED, fd, offset);

// Map anonymous memory (like malloc but page-aligned)
void *buf = mmap(NULL, 4096, PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);

// Map physical memory (requires /dev/mem or UIO driver)
int mem_fd = open("/dev/mem", O_RDWR | O_SYNC);
volatile uint32_t *regs = mmap(NULL, 0x1000,
    PROT_READ | PROT_WRITE, MAP_SHARED, mem_fd, 0x40020000);
```

This is how Linux userspace drivers (UIO, VFIO) access hardware registers — the kernel maps the physical MMIO region into the process's virtual space.

### 11.3 `/proc/<pid>/maps`

Inspect the complete memory map of a running process:

```
address           perms offset   dev   inode       pathname
00400000-00452000 r-xp 00000000 08:01 1234567     /usr/bin/myapp  (.text)
00651000-00652000 r--p 00051000 08:01 1234567     /usr/bin/myapp  (.rodata)
00652000-00653000 rw-p 00052000 08:01 1234567     /usr/bin/myapp  (.data)
00653000-00677000 rw-p 00000000 00:00 0           [heap]
7f8a00000000-7f8a02000000 rw-p 00000000 00:00 0   (anonymous mmap)
7ffc8d000000-7ffc8d200000 rw-p 00000000 00:00 0   [stack]
```

`r-xp` = read + execute + private (copy-on-write). `rw-p` = read + write + private.

---

## 12. Key Rules — The Cheat Sheet

```
VOLATILE
  ✓ Use for every MMIO register access
  ✓ Use for ISR-shared flags on single-core
  ✗ Does NOT make operations atomic
  ✗ Does NOT provide SMP memory ordering

STATIC
  File scope  → internal linkage (module-private)
  Local var   → persistent storage in .bss/.data
  Parameter   → minimum array size hint (C99)

CONST
  File scope  → .rodata (Flash on embedded — saves RAM)
  Local       → stack (no .rodata optimisation)
  const volatile → read-only hardware register

SEGMENTS
  .text    → code, read-only, zero RAM on embedded
  .rodata  → constants, read-only, zero RAM on embedded
  .data    → init globals/statics, in Flash + copied to RAM
  .bss     → zero globals/statics, zeroed by startup, no Flash space
  stack    → local vars, grows down, fixed size
  heap     → dynamic alloc, grows up, managed by allocator
  MMIO     → hardware registers, always volatile, no caching

TYPES — always use stdint.h in systems code
  uint8_t / int8_t      → 1 byte, always
  uint16_t / int16_t    → 2 bytes, always
  uint32_t / int32_t    → 4 bytes, always
  uint64_t / int64_t    → 8 bytes, always
  uintptr_t             → pointer-sized integer
  size_t                → object size, unsigned
  ptrdiff_t             → pointer difference, signed

ALIGNMENT
  Struct members aligned to their own size by default
  struct tail-padded to alignment of largest member
  Use __attribute__((packed)) only at ABI boundaries
  Use __attribute__((aligned(N))) for SIMD / DMA buffers
  DMA buffers: must be cache-line aligned (32 or 64 bytes) on cached systems
```

---

## 13. Practical Checklist for Systems Code

- [ ] All MMIO accesses through `volatile` pointers
- [ ] `static_assert(sizeof(wire_frame_t) == WIRE_SIZE, "layout mismatch")` for protocol structs
- [ ] Fixed-width integer types (`uint32_t` not `unsigned long`) throughout
- [ ] No `malloc`/`free` in ISR context
- [ ] Stack size budgeted and watermarked in RTOS tasks
- [ ] `.data` and `.bss` init verified in startup code before `main()`
- [ ] DMA buffers declared with cache-line alignment and marked `volatile` or managed with explicit cache flush/invalidate
- [ ] File-scope helper functions declared `static` to prevent symbol pollution
- [ ] `const` on all read-only data to ensure Flash placement on embedded
- [ ] ISR-shared variables declared `volatile`; SMP-shared variables use `_Atomic` or explicit barriers

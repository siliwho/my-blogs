---
title: "C-keywords"
description: "keywords in c explained"
date: "2026-03-22"
tags: ["C", "gdb"]
category: "Systems Programming"
draft: false
---

# C Keywords


---
title: "C-keywords"
description: "keywords in c explained"
date: "2026-03-22"
tags: ["C", "gdb"]
category: "Systems Programming"
draft: false
---

# C Keywords

---

## Structs

A `struct` is a composite data type that groups variables of different types under a single name. Each member has its own memory region — unlike a `union`, where all members share the same memory.

![image](struct3.png)

```c
typedef struct test {
    char r;
    char g;
    int  b;
} ok;
```

You might expect `sizeof(ok)` to be `1 + 1 + 4 = 6` bytes, but it is actually **8 bytes**. This is due to **struct padding**.

---

### Memory Layout & Alignment

The C standard does not mandate padding, but every real-world ABI (x86-64 System V, ARM AAPCS, RISC-V psABI, etc.) requires that each member be stored at an address that is a multiple of its own size. This is called **natural alignment**.

| Type       | Size (bytes) | Required alignment |
|------------|--------------|--------------------|
| `char`     | 1            | 1                  |
| `short`    | 2            | 2                  |
| `int`      | 4            | 4                  |
| `long`     | 8            | 8                  |
| `pointer`  | 8            | 8                  |
| `float`    | 4            | 4                  |
| `double`   | 8            | 8                  |

**Rule:** The compiler inserts invisible padding bytes so that each member starts at its required alignment. The struct itself is padded at the end so that its total size is a multiple of its largest member's alignment.

#### Worked example — the original struct

```
Offset  Byte(s)  Content
──────  ───────  ──────────────────────────────
  0       1      char r
  1       1      char g
  2–3     2      padding  ← needed so 'b' starts at offset 4 (multiple of 4)
  4–7     4      int b
─────────────────────────
Total = 8 bytes
```

`sizeof(ok) == 8`

#### Visualising with GDB / pahole

```c
#include <stdio.h>

typedef struct test {
    char r;
    char g;
    int  b;
} ok;

int main(void) {
    ok s;
    printf("sizeof(ok) = %zu\n", sizeof(ok));
    printf("offsetof r = %zu\n", __builtin_offsetof(ok, r));
    printf("offsetof g = %zu\n", __builtin_offsetof(ok, g));
    printf("offsetof b = %zu\n", __builtin_offsetof(ok, b));
    return 0;
}
```

Output:
```
sizeof(ok) = 8
offsetof r = 0
offsetof g = 1
offsetof b = 4
```

Using `pahole` (part of `dwarves` package):
```bash
gcc -g -o test test.c
pahole test
```
```
struct test {
        char                       r;                    /*     0     1 */
        char                       g;                    /*     1     1 */

        /* 2 bytes hole, try to pack */

        int                        b;                    /*     4     4 */

        /* size: 8, cachelines: 1, members: 3 */
        /* last cacheline: 8 bytes */
};
```

![alt text](struct1.png)

---

### Padding & Pack Ordering — Reducing Wasted Space

Reordering members from **largest to smallest** eliminates padding:

```c
// BAD — 12 bytes due to padding
struct bad {
    char  a;   // offset 0
    // 3 bytes padding
    int   b;   // offset 4
    char  c;   // offset 8
    // 3 bytes padding
};             // total = 12

// GOOD — 8 bytes, no internal padding
struct good {
    int   b;   // offset 0
    char  a;   // offset 4
    char  c;   // offset 5
    // 2 bytes tail padding
};             // total = 8
```
![alt text](struct2.png)


**Rule of thumb for field ordering:** `int > short > char`, or more precisely: sort by descending alignment requirement.

---

### `__attribute__((packed))` — Disable Padding

GCC and Clang support the `packed` attribute to eliminate all padding:

```c
typedef struct __attribute__((packed)) {
    char r;   // offset 0
    char g;   // offset 1
    int  b;   // offset 2  ← unaligned!
} ok_packed;

// sizeof(ok_packed) == 6
```

**Warning — packed structs are dangerous on most architectures.** On ARM Cortex-M (no hardware unaligned access) reading `b` directly will fault. On x86 it works but causes slower bus cycles. Use packed structs **only** for:

- On-the-wire protocol frames (network, serial, USB)
- Memory-mapped register maps that are defined by hardware spec
- Binary file headers (FAT, ELF, PE)

**Never** pass a pointer to a packed member into a function that expects an aligned pointer:

```c
ok_packed p;
int *ptr = &p.b;   // UB — may be misaligned
memcpy(&local_b, &p.b, sizeof(int));  // CORRECT way to read
```

---

### `#pragma pack` — MSVC / Keil / IAR Style

Commonly used in embedded toolchains:

```c
#pragma pack(push, 1)
typedef struct {
    uint8_t  start;
    uint16_t length;
    uint32_t crc;
} frame_t;
#pragma pack(pop)
```

`sizeof(frame_t) == 7` with `pack(1)` vs `12` without.

---

### Flexible Array Members (C99)

Used in kernel code (Linux uses this extensively):

```c
struct packet {
    uint32_t length;
    uint8_t  data[];   // flexible array — must be last member
};

// Allocate a packet with 64 bytes of data
struct packet *pkt = malloc(sizeof(struct packet) + 64);
pkt->length = 64;
```

`sizeof(struct packet) == 4` — the flexible array contributes 0 to sizeof. This replaces the old `[0]` and `[1]` tricks common in pre-C99 kernels.

---

### Designated Initialisers (C99)

```c
ok s = {
    .r = 0xFF,
    .g = 0x00,
    .b = 255,
};
```

Members not mentioned are zero-initialised. This is the safe, forward-compatible pattern — adding a new struct member will not silently leave it uninitialised.

---

### Bit Fields

Useful for packing hardware register layouts:

```c
typedef struct {
    uint32_t mode   : 2;   // bits [1:0]
    uint32_t enable : 1;   // bit  [2]
    uint32_t speed  : 3;   // bits [5:3]
    uint32_t        : 2;   // 2 reserved bits
    uint32_t irq    : 1;   // bit  [8]
    uint32_t        : 23;  // padding to 32-bit boundary
} ctrl_reg_t;
```

**Caveats for firmware/kernel engineers:**
- Bit-field layout (endianness, packing) is **implementation-defined**. Do **not** use bit fields for memory-mapped I/O or protocol frames if you need portability — use explicit masks and shifts instead.
- Only use bit fields for readability in code that controls a specific known toolchain/ABI pair.

For MMIO, prefer:

```c
#define CTRL_MODE_MASK   0x00000003U
#define CTRL_MODE_SHIFT  0
#define CTRL_ENABLE_BIT  (1U << 2)
#define CTRL_SPEED_MASK  (0x7U << 3)

volatile uint32_t *ctrl = (volatile uint32_t *)0x40020000UL;
*ctrl = (*ctrl & ~CTRL_SPEED_MASK) | (2U << 3);
```

---

### Anonymous Structs (C11)

```c
struct point3d {
    struct { float x, y; };  // anonymous inner struct
    float z;
};

struct point3d p = { .x = 1.0f, .y = 2.0f, .z = 3.0f };
printf("%f\n", p.x);   // accessed directly — not p.xy.x
```

Used heavily in the Linux kernel via `container_of` patterns.

---

### `container_of` — The Linux Kernel Pattern

One of the most important struct idioms in systems code:

```c
#define container_of(ptr, type, member) \
    ((type *)((char *)(ptr) - offsetof(type, member)))
```

This lets you embed a generic node struct inside a larger struct and recover the outer pointer:

```c
struct list_node {
    struct list_node *next;
    struct list_node *prev;
};

struct process {
    int              pid;
    char             name[64];
    struct list_node list;   // embedded into a doubly-linked list
};

// Given a pointer to list_node, recover the process pointer:
struct list_node *node = get_next_node();
struct process   *proc = container_of(node, struct process, list);
```

---

### Cache Line Awareness

Modern CPUs fetch memory in **cache lines** (typically 64 bytes on x86/ARM Cortex-A). For performance-critical kernel data structures:

```c
// Pad struct to fill one cache line — prevents false sharing
struct per_cpu_counter {
    long value;
    char _pad[64 - sizeof(long)];
} __attribute__((aligned(64)));
```

The Linux kernel uses `____cacheline_aligned` and `____cacheline_internodealigned_in_smp` macros for this.

---

### Forward Declaration & Opaque Pointers

```c
// In header — opaque pointer hides internals
typedef struct device device_t;

device_t *device_open(const char *path);
void      device_close(device_t *dev);
int       device_read(device_t *dev, void *buf, size_t len);

// In .c — full definition visible only to implementation
struct device {
    int      fd;
    uint32_t flags;
    size_t   rx_count;
};
```

This is the standard pattern for driver and HAL APIs — consumers cannot directly access internals, enforcing encapsulation in C.

---

## Unions

A `union` allocates memory equal to its **largest** member. All members share the same starting address. Writing one member and reading another is **type punning** — the legal way to reinterpret bytes.

```c
typedef union {
    uint32_t raw;
    struct {
        uint8_t b0;
        uint8_t b1;
        uint8_t b2;
        uint8_t b3;
    } bytes;
    struct {
        uint16_t lo;
        uint16_t hi;
    } words;
} u32_view_t;
```

```c
u32_view_t v;
v.raw = 0xDEADBEEF;

printf("b0 = 0x%02X\n", v.bytes.b0);  // 0xEF on little-endian
printf("lo = 0x%04X\n", v.words.lo);  // 0xBEEF on little-endian
```

`sizeof(u32_view_t) == 4`

---

### Memory Layout

```
Address:  base+0   base+1   base+2   base+3
          ┌────────┬────────┬────────┬────────┐
 .raw     │  byte0 │  byte1 │  byte2 │  byte3 │  (uint32_t)
          ├────────┼────────┼────────┼────────┤
 .bytes   │  b0    │  b1    │  b2    │  b3    │  (4× uint8_t)
          ├─────────────────┼─────────────────┤
 .words   │       lo        │       hi        │  (2× uint16_t)
          └─────────────────┴─────────────────┘
```

All three views start at the same address. The union size = 4 bytes.

---

### Endianness Detection with Union

```c
static inline int is_little_endian(void) {
    union { uint32_t u; uint8_t c; } x = { .u = 1 };
    return x.c == 1;
}
```

---

### Type Punning — The Only Defined Method (C99/C11)

Reading from a union member different from the one last written is **defined behaviour in C** (C11 §6.5.2.3). This is **not** true in C++ (use `memcpy` there). This makes unions the standard way to reinterpret bits in embedded C:

```c
// Convert float bits to uint32 — defined in C, UB via cast in C++
union float_bits {
    float    f;
    uint32_t u;
};

union float_bits fb = { .f = 3.14f };
printf("IEEE 754 bits: 0x%08X\n", fb.u);  // 0x4048F5C3
```

The `memcpy` method is equivalent and also defined in both C and C++:

```c
float    f = 3.14f;
uint32_t u;
memcpy(&u, &f, sizeof u);   // always safe, compiler optimises to register move
```

---

### Tagged Union (Discriminated Union)

The standard pattern for variant types in C — used extensively in compilers, protocol stacks, and the Linux kernel (`union` inside `struct sk_buff`, etc.):

```c
typedef enum { TYPE_INT, TYPE_FLOAT, TYPE_STRING } value_type_t;

typedef struct {
    value_type_t type;
    union {
        int    i;
        float  f;
        char  *s;
    } data;
} value_t;

void print_value(const value_t *v) {
    switch (v->type) {
        case TYPE_INT:    printf("%d\n",  v->data.i); break;
        case TYPE_FLOAT:  printf("%f\n",  v->data.f); break;
        case TYPE_STRING: printf("%s\n",  v->data.s); break;
    }
}
```

---

### Hardware Register Overlay (Firmware Pattern)

One of the most common uses of unions in firmware: overlay the raw register integer with a bitfield struct for named field access:

```c
typedef union {
    uint32_t raw;
    struct {
        uint32_t enable  : 1;   // bit 0
        uint32_t mode    : 2;   // bits [2:1]
        uint32_t         : 1;   // bit 3 reserved
        uint32_t prescal : 4;   // bits [7:4]
        uint32_t         : 24;  // bits [31:8] reserved
    };
} tim_ctrl_t;

// Usage
volatile tim_ctrl_t *TIM1_CTRL = (volatile tim_ctrl_t *)0x40010000UL;

TIM1_CTRL->enable  = 1;
TIM1_CTRL->mode    = 2;
TIM1_CTRL->prescal = 8;
```

> **Portability note:** Bit-field layout is implementation-defined. This pattern is common in vendor HAL code (STM32 HAL, Nordic nRF SDK) and is safe as long as you stay on the same toolchain/ABI. For truly portable MMIO code, use explicit mask/shift macros as shown in the struct bit-field section above.

---

### `sizeof` — Union vs Struct

```c
union example {
    char   c;      // 1 byte
    short  s;      // 2 bytes
    int    i;      // 4 bytes
    double d;      // 8 bytes
};

// sizeof(union example) == 8   (size of largest member)
// sizeof is also padded to alignment of largest member
```

```c
struct example {
    char   c;      // 1 byte + 1 byte padding
    short  s;      // 2 bytes
    int    i;      // 4 bytes
    double d;      // 8 bytes
};

// sizeof(struct example) == 16  (sum + padding)
```

---

### `offsetof` and `sizeof` Cheat Sheet

```c
#include <stddef.h>

offsetof(type, member)   // byte offset of member from start of type
sizeof(type)             // total size including padding
sizeof(x)                // size of variable x

// Common usage in serialisation:
static_assert(sizeof(frame_t) == 7, "frame_t size mismatch — check packing");
static_assert(offsetof(frame_t, crc) == 3, "crc offset wrong — ABI broken");
```

---

### Nested Structs and Unions — Full Example

```c
// Represents a 32-bit ARM instruction word
typedef union {
    uint32_t raw;

    struct {                     // Data Processing (immediate)
        uint32_t imm12   : 12;
        uint32_t Rd      :  4;
        uint32_t Rn      :  4;
        uint32_t S       :  1;
        uint32_t opcode  :  4;
        uint32_t I       :  1;
        uint32_t cond    :  4;
        uint32_t fixed10 :  2;  // must be 0b00
    } dp_imm;

    struct {                     // Branch
        int32_t  offset  : 24;
        uint32_t L       :  1;
        uint32_t fixed101:  3;  // must be 0b101
        uint32_t cond    :  4;
    } branch;
} arm_insn_t;
```

---

### Summary Table

| Feature                    | Struct                         | Union                            |
|----------------------------|--------------------------------|----------------------------------|
| Memory                     | Sum of members + padding       | Largest member + tail padding    |
| Member addresses           | Different for each member      | Same for all members             |
| Use case                   | Group related fields           | Reinterpret / variant types      |
| Active members             | All simultaneously             | One at a time (logically)        |
| Type punning (C)           | Not applicable                 | Defined behaviour (C11 §6.5.2.3) |
| Type punning (C++)         | Not applicable                 | UB — use `memcpy` instead        |
| MMIO overlay               | Use bitfields (with caveats)   | union{uint32_t raw; struct{...}} |
| Protocol frames            | `__attribute__((packed))`      | Rarely used alone                |
| Kernel linked lists        | `container_of` + embedded node | Not typically used               |

---

### Key Rules for Firmware / Kernel / Systems Engineers

1. **Never assume `sizeof(struct)` without checking** — always use `pahole` or `offsetof` to verify layout.
2. **Sort struct fields largest-to-smallest** to eliminate padding in hot paths.
3. **Use `packed` only at ABI boundaries** (protocol frames, MMIO maps) — never for general-purpose structs.
4. **Use `memcpy` for type punning in C++**, union-based type punning in C only.
5. **Bit fields in MMIO overlays are toolchain-specific** — document which toolchain/ABI you rely on.
6. **`static_assert` your sizes and offsets** at compile time — `sizeof(frame_t) == WIRE_FRAME_SIZE`.
7. **`volatile` is required for all MMIO accesses** — without it the compiler may optimise away reads/writes.
8. **Flexible array members replace `[0]` and `[1]` tricks** — use FAMs for variable-length kernel objects.
9. **`container_of` is the safe way to recover enclosing struct pointers** — never do pointer arithmetic manually.
10. **Cache line alignment matters** — pad per-CPU or frequently-contested kernel structs to 64 bytes to avoid false sharing.
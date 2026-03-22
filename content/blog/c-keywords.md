---
title: "C-keywords"
description: "keywords in c explained"
date: "2026-03-22"
tags: ["C", "gdb"]
category: "Systems Programming"
draft: false
---

# Everything You Can Do in a Blog Post

This post demonstrates every feature available in your blog renderer.

## Syntax Highlighting

Full syntax highlighting via **Shiki** — just write fenced code blocks with the language name.

```c
#include "stm32f4xx.h"

int main(void) {
    RCC->AHB1ENR |= RCC_AHB1ENR_GPIODEN;
    GPIOD->MODER |= (1 << 24);

    while (1) {
        GPIOD->ODR ^= (1 << 12);
        for (volatile int i = 0; i < 1000000; i++);
    }
}
```

```rust
fn main() {
    let mut counter: u32 = 0;
    loop {
        counter = counter.wrapping_add(1);
        println!("tick {counter}");
    }
}
```

```python
import struct

def parse_can_frame(data: bytes) -> dict:
    can_id, dlc = struct.unpack(">IB", data[:5])
    payload = data[5:5 + (dlc & 0xF)]
    return {"id": hex(can_id), "dlc": dlc & 0xF, "data": payload.hex()}
```

```bash
openocd -f interface/stlink.cfg \
        -f target/stm32f4x.cfg \
        -c "program firmware.elf verify reset exit"
```

### Copy Button

Every code block has a **Copy** button that appears on hover in the top-right corner.

### Code with a Filename

Add `title="filename"` after the language:

```c title="src/scheduler.c"
void scheduler_tick(void) {
    current_task->ticks_remaining--;
    if (current_task->ticks_remaining == 0)
        schedule();
}
```

### Line Numbers

Add `showLineNumbers` after the language:

```c showLineNumbers
static task_t *tasks[MAX_TASKS];
static uint8_t task_count = 0;

void task_create(void (*fn)(void), uint8_t priority) {
    tasks[task_count++] = task_alloc(fn, priority);
}
```

---

## Callouts

<Callout type="tip">
Use `__attribute__((optimize("O0")))` to prevent the compiler from optimising away debug loops during development.
</Callout>

<Callout type="info" title="ARM Architecture Note">
On Cortex-M, PendSV is always used for context switching because it runs at the lowest configurable interrupt priority.
</Callout>

<Callout type="warn">
Never call `HAL_Delay()` inside an interrupt handler. It relies on SysTick which cannot fire while you are already in an exception context.
</Callout>

<Callout type="error">
Dereferencing a userspace pointer directly in kernel code will cause a kernel panic. Always use `copy_from_user()`.
</Callout>

<Callout type="note">
This behaviour changed in Linux kernel 5.18. Earlier versions allowed raw access in certain restricted contexts.
</Callout>

---

## Steps

<Steps>
  <Step title="Install the toolchain">
    On Arch Linux: `sudo pacman -S arm-none-eabi-gcc openocd`. On Ubuntu: `sudo apt install gcc-arm-none-eabi openocd`.
  </Step>
  <Step title="Clone and configure">
    Clone the repo and copy `config.example.h` to `config.h`. Set your target MCU and clock frequency.
  </Step>
  <Step title="Build and flash">
    Run `make` to build, then `make flash` to program via SWD. OpenOCD handles the upload automatically.
  </Step>
</Steps>

---

## Keyboard Shortcuts

Press <Kbd>Ctrl</Kbd> + <Kbd>C</Kbd> to copy. Use <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>P</Kbd> in VSCode to open the command palette.

---

## File Tree

<FileTree>
firmware/
├── Core/
│   ├── Inc/
│   │   ├── main.h
│   │   └── gpio.h
│   └── Src/
│       ├── main.c
│       └── gpio.c
├── Drivers/
│   └── STM32F4xx_HAL_Driver/
└── Makefile
</FileTree>

---

## Diff

Show a before/after change:

<Diff remove="HAL_GPIO_WritePin(GPIOD, GPIO_PIN_12, GPIO_PIN_SET);" add="gpio_set(GPIOD, GPIO_PIN_12);" />

---

## Chips

This applies to <Chip>ARM Cortex-M4</Chip> and <Chip>STM32F4</Chip> targets only.

---

## Divider

Content above.

<Divider label="implementation" />

Content below.

---

## Math with KaTeX

Inline math: the RC time constant is $\tau = RC$.

Block equations:

$$
f_c = \frac{1}{2\pi RC}
$$

$$
\text{BRR} = \frac{f_{CLK}}{16 \times \text{Baud}} = \frac{84\,\text{MHz}}{16 \times 115200} \approx 45.57
$$

---

## Images

Place images in `public/blog-images/` and reference by filename only. Click any image to zoom.

```markdown
![STM32 pinout](stm32f4-pinout.png)
```

With a caption:

```mdx
<Figure src="rtos-arch.png" caption="RTOS scheduler architecture" />
```

---

## Tables

| Register | Offset | Description |
|---|---|---|
| `MODER` | 0x00 | Mode — input / output / AF / analog |
| `ODR` | 0x14 | Output data register |
| `IDR` | 0x10 | Input data register |
| `BSRR` | 0x18 | Bit set/reset (atomic) |

---

## Blockquote

> The purpose of abstracting is not to be vague, but to create a new semantic level in which one can be absolutely precise.
>
> — Edsger Dijkstra

---

## Task Lists

- [x] Implement PendSV handler
- [x] Write context switch routine
- [ ] Add priority inheritance to mutexes
- [ ] Port to RISC-V

---

## Footnotes

The ARM Cortex-M4 includes a hardware FPU[^1] which significantly reduces floating-point overhead in DSP workloads.

[^1]: FPU = Floating Point Unit. The Cortex-M4 FPU supports single-precision IEEE 754 operations.
---
title: "Writing a Preemptive RTOS Scheduler from Scratch on ARM Cortex-M4"
description: "A deep dive into building a preemptive task scheduler in C for the STM32F4 — context switching, PendSV, and priority-based scheduling without any external RTOS."
date: "2024-11-15"
tags: ["RTOS", "ARM", "STM32", "C", "Embedded"]
category: "Embedded Systems"
---

# Writing a Preemptive RTOS Scheduler from Scratch on ARM Cortex-M4

Building a Real-Time Operating System scheduler from scratch is one of the best exercises in understanding what an OS actually does at the hardware level. In this post I'll walk through the core concepts and code for a preemptive scheduler targeting the STM32F4 (ARM Cortex-M4).

## Why Build Your Own?

Using FreeRTOS is the practical choice. But understanding *how* FreeRTOS works is invaluable when you're debugging a stack overflow at 3am or trying to shave 2KB from flash. Also, it's genuinely fun.

## The Core Idea

A preemptive scheduler does one job: **switch the CPU between tasks transparently**, making each task believe it owns the processor. To do this we need to:

1. Save the running task's register state
2. Pick the next task to run
3. Restore that task's register state
4. Jump to it

On ARM Cortex-M, this is done via the **PendSV exception**.

## Stack Layout

Each task needs its own stack. On Cortex-M, when an exception occurs the hardware automatically pushes a subset of registers onto the stack:

```c
// Hardware-saved exception frame (pushed automatically)
typedef struct {
    uint32_t r0, r1, r2, r3;
    uint32_t r12;
    uint32_t lr;   // Link register
    uint32_t pc;   // Return address
    uint32_t xpsr; // Program status register
} hw_frame_t;

// Software-saved registers (we push these manually)
typedef struct {
    uint32_t r4, r5, r6, r7;
    uint32_t r8, r9, r10, r11;
} sw_frame_t;
```

When creating a new task, we fake an initial stack frame so the first context switch into it works correctly:

```c
void task_init_stack(task_t *task, void (*entry)(void), uint32_t *stack_top) {
    // Fake hw frame at top of stack
    hw_frame_t *frame = (hw_frame_t *)(stack_top - sizeof(hw_frame_t)/4);
    memset(frame, 0, sizeof(hw_frame_t));
    frame->pc   = (uint32_t)entry;
    frame->xpsr = 0x01000000; // Thumb bit must be set
    frame->lr   = (uint32_t)task_exit_handler; // Called if task returns

    // SW frame below that
    sw_frame_t *sw = (sw_frame_t *)((uint8_t *)frame - sizeof(sw_frame_t));
    memset(sw, 0, sizeof(sw_frame_t));

    task->sp = (uint32_t)sw;
}
```

## The PendSV Handler

PendSV is designed exactly for context switching. It runs at the lowest exception priority so it doesn't interrupt other handlers. Here's the assembly:

```c
__attribute__((naked)) void PendSV_Handler(void) {
    __asm volatile (
        // Save SW registers of current task
        "MRS     R0, PSP            \n" // Get Process Stack Pointer
        "STMDB   R0!, {R4-R11}      \n" // Push R4-R11 onto task stack
        "LDR     R1, =current_task  \n"
        "LDR     R2, [R1]           \n"
        "STR     R0, [R2]           \n" // Save new SP into task->sp

        // Call scheduler to pick next task
        "PUSH    {R1, LR}           \n"
        "BL      scheduler_pick_next\n"
        "POP     {R1, LR}           \n"

        // Restore SW registers of next task
        "LDR     R2, [R1]           \n" // current_task (updated by scheduler)
        "LDR     R0, [R2]           \n" // Load new SP
        "LDMIA   R0!, {R4-R11}      \n" // Pop R4-R11
        "MSR     PSP, R0            \n" // Restore PSP
        "BX      LR                 \n" // Return from exception
    );
}
```

<Callout type="tip">
The `naked` attribute tells GCC not to generate any prologue/epilogue for this function. Without it, the compiler would push LR onto the main stack before our code runs — corrupting the context switch.
</Callout>

## The Scheduler

A basic round-robin scheduler just cycles through ready tasks:

```c
static task_t *tasks[MAX_TASKS];
static uint8_t task_count = 0;
static uint8_t current_idx = 0;
task_t *current_task;

void scheduler_pick_next(void) {
    uint8_t start = current_idx;
    do {
        current_idx = (current_idx + 1) % task_count;
    } while (tasks[current_idx]->state != TASK_READY && current_idx != start);

    current_task = tasks[current_idx];
}
```

For priority scheduling, we instead pick the highest-priority ready task:

```c
void scheduler_pick_next_priority(void) {
    task_t *best = NULL;
    for (uint8_t i = 0; i < task_count; i++) {
        if (tasks[i]->state == TASK_READY) {
            if (!best || tasks[i]->priority > best->priority) {
                best = tasks[i];
            }
        }
    }
    current_task = best;
}
```

## Triggering a Context Switch

The SysTick interrupt fires at our tick rate (e.g. 1ms) and pends PendSV:

```c
void SysTick_Handler(void) {
    tick_count++;
    // Pend a PendSV — actual switch happens at lowest priority
    SCB->ICSR |= SCB_ICSR_PENDSVSET_Msk;
}
```

## Testing It

With two tasks blinking LEDs at different rates, you can verify preemption is working with a logic analyser or oscilloscope. Both LEDs should blink independently with their correct timing.

```c
void task_led1(void) {
    while (1) {
        HAL_GPIO_TogglePin(GPIOD, GPIO_PIN_12);
        rtos_delay_ms(500);
    }
}

void task_led2(void) {
    while (1) {
        HAL_GPIO_TogglePin(GPIOD, GPIO_PIN_14);
        rtos_delay_ms(1000);
    }
}
```

## What's Next

This gives us preemptive multitasking, but a real RTOS also needs:

- **Semaphores** (with priority inheritance to avoid inversion)
- **Message queues** for inter-task communication
- **Mutexes** with proper ownership tracking
- **Stack overflow detection** via MPU or watermark patterns

I'll cover semaphores and priority inheritance in the next post. The full source is on [GitHub](https://github.com/yourusername/rtos-scheduler).

## Architecture Diagram

Images in your posts go in `public/blog-images/`. Reference them like this in Markdown:

```markdown
![Context switch flow](context-switch.png)
```

Or with a caption using the MDX Figure component:

```mdx
<Figure src="rtos-arch.png" caption="RTOS task scheduler architecture" />
```

Both resolve automatically from `/public/blog-images/` — no need to write full paths.
Click any image to zoom in, or use the download button in the lightbox.

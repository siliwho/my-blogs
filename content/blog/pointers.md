---
title: "Pointers"
description: "reading about pointers"
date: "2026-03-28"
tags: ["pointers", "memory", "systems programming"]
category: "Systems Programming"
draft: false
---

# Fundamentals of Pointers

## Declaration & Basic Syntax

![alt text](pointer1.png)

The type in a pointer declaration tells the compiler how many bytes to read when the pointer is dereferenced, and the alignment requirements of the pointed-to object.

```c
char   *p;   // points to 1 byte  (char  = 1 byte)
short  *p;   // points to 2 bytes (short = 2 bytes)
int    *p;   // points to 4 bytes (int   = 4 bytes on most 32/64-bit)
long   *p;   // points to 8 bytes (long  = 8 bytes on 64-bit Linux)
float  *p;   // points to 4 bytes
double *p;   // points to 8 bytes
void   *p;   // generic pointer — no type, cannot be dereferenced directly
```

![pic 2](pointer2.png)

> KEY INSIGHT: The pointer variable itself (p) is always the same size regardless of the type it points to.  
> On a 64-bit system: sizeof(p) == 8 bytes for ALL pointer types.  
> On a 32-bit system: sizeof(p) == 4 bytes for ALL pointer types.  
> The type (char*, int*, etc.) only affects how many bytes are read on dereference.

```c
#include <stdio.h>
 
int main(void) {
    char   c  = 'A';
    int    i  = 42;
    double d  = 3.14;
 
    char   *pc = &c;
    int    *pi = &i;
    double *pd = &d;
 
    // All pointers are 8 bytes on 64-bit
    printf("sizeof(pc) = %zu\n", sizeof(pc));  // 8
    printf("sizeof(pi) = %zu\n", sizeof(pi));  // 8
    printf("sizeof(pd) = %zu\n", sizeof(pd));  // 8
 
    // Pointed-to sizes differ
    printf("sizeof(*pc) = %zu\n", sizeof(*pc)); // 1
    printf("sizeof(*pi) = %zu\n", sizeof(*pi)); // 4
    printf("sizeof(*pd) = %zu\n", sizeof(*pd)); // 8
    return 0;
}
```

## The Address Space Model

On a 64-bit Linux system, the virtual address space is 48 bits wide (256 TiB). Pointers represent virtual addresses, not physical addresses. The MMU (Memory Management Unit) translates virtual → physical at runtime.

| Region       | Address Range (typical) | Contents                                     |
| ------------ | ----------------------- | -------------------------------------------- |
| Kernel space | 0xFFFF800000000000+     | Kernel code, kernel heap, physical mem map   |
| Stack        | 0x7FFFFFFFFFFF down     | Local vars, function frames (grows downward) |
| mmap / libs  | ~0x7F0000000000         | Shared libs, mmap'd files                    |
| Heap         | After BSS, grows up     | Uninitialized globals (zeroed)               |
| Data         | After text              | Initialized globals, static vars             |
| Text         | 0x400000 (user)         | Executable code (read-only)                  |
| NULL zone    | 0x0 – 0xFFF             | Unmapped — dereference = SIGSEGV             |



![pic3](pointer3.png)

as can see here when i run the program it fails.


![pic4](pointer4.png)



Let’s focus on the important part:

```c
char num[4];
int *in_ptr = &num[0];
```

This line gives a warning because:

```c
&num[0]
```

is of type:

```c
char *
```

but are storing it in:

```c
int *
```

So compiler says:

> incompatible pointer type

because a `char*` points to **1 byte**
while an `int*` points to **4 bytes** (usually).

Still, C allows it with warning.

So now:

```c
in_ptr
```

points to the **first byte of the char array**.

Memory looks like this:

```text
num[0] num[1] num[2] num[3]
```

Each box = 1 byte.


```c
*in_ptr = 65;
```

Since `in_ptr` is an `int*`, dereferencing it writes **4 bytes**.

Even though `num` is a char array.

So:

```c
65 = 0x00000041
```

Binary:

```text
00000000 00000000 00000000 01000001
```

That full 4-byte integer gets written into the array.


```text
65
0
0
0
```

Because the bytes got stored as:

```text
41 00 00 00
```

That means:

```c
num[0] = 65
num[1] = 0
num[2] = 0
num[3] = 0
```

Exactly what printed.

This already tells us system is **little-endian**.


When did:

```c
printf("%c\n", *in_ptr);
```

`*in_ptr` = 65

ASCII value 65 = `'A'`

So output:

```text
A
```
![pic 5](pointer5.png)

I wrote:

```c
*in_ptr = 0x48492100;
```

Let’s split it into bytes.

```text
0x48 0x49 0x21 0x00
```

ASCII values:

```text
0x48 = H
0x49 = I
0x21 = !
0x00 = null
```

Now the important question:

> In what order will memory store these bytes?

That depends on **endianness**.

As the machine is little-endian.

That means:

> Least Significant Byte is stored first

In simple words:

> smaller byte goes to lower memory address first

So memory stores this integer as:

```text
00 21 49 48
```

inside array:

```text
num[0] = 0x00
num[1] = 0x21   -> !
num[2] = 0x49   -> I
num[3] = 0x48   -> H
```

That is why output became:

```text

!
I
H
```

First one is blank because `0x00` is null character.

Perfect observation.


I revesed it and  wrote:

```c
*in_ptr = 0x00214948;
```

Bytes:

```text
00 21 49 48
```

Now little-endian stores them reversed in memory:

```text
48 49 21 00
```

So array becomes:

```text
num[0] = H
num[1] = I
num[2] = !
num[3] = \0
```

So output:

```text
H
I
!
```

Exactly what saw.


### Little endian

Stores **least significant byte first**

Example:

```c
int x = 0x12345678;
```

Memory:

```text
78 56 34 12
```

Lower address → higher address

```text
|78|56|34|12|
```

This is used by:

* Intel x86
* AMD x86_64
* most PCs and laptops
  machine is this.

---

### Big endian

Stores **most significant byte first**

Same number:

```c
0x12345678
```

Memory:

```text
12 34 56 78
```

Like normal human reading order.

```text
|12|34|56|78|
```

Some network protocols and certain processors use this.

> A trick we can use is if memory save the input as it is we wrote its `big endian` other wise `little endian`.




# Pointer Operators

## Address-of (&) and Dereference (\*)

```c
int x = 100;
int *p = &x;   // & gives the address of x
 
printf("%d\n", *p);  // * dereferences: reads 4 bytes at p's address -> 100
*p = 200;             // write through pointer: x is now 200
printf("%d\n", x);   // prints 200
```

Think of & as 'give me the address of' and \* as 'go to that address and give me the value'.

## Arrow Operator (->)

```c
struct Device {
    uint32_t base_addr;
    uint8_t  irq;
};
 
struct Device dev = { .base_addr = 0x40010000, .irq = 5 };
struct Device *dp = &dev;
 
// These two lines are equivalent:
(*dp).irq = 7;
dp->irq   = 7;   // cleaner — use this
```

## Pointer Arithmetic

Pointer arithmetic is scaled by the size of the pointed-to type. Adding 1 to an int\* moves forward by `sizeof(int)` bytes, not 1 byte.

```c
int arr[5] = {10, 20, 30, 40, 50};
int *p = arr;          // points to arr[0] (address e.g. 0x7fff1000)
 
p + 0  // 0x7fff1000  -> value 10
p + 1  // 0x7fff1004  -> value 20  (+4 bytes because sizeof(int)=4)
p + 2  // 0x7fff1008  -> value 30
 
// Equivalent access patterns:
*(p + 2) == p[2] == arr[2]  // all give 30
 
// Pointer difference (gives element count, NOT byte count):
int *end = arr + 5;
ptrdiff_t count = end - arr;  // = 5  (use ptrdiff_t, not int!)
```

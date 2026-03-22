---
title: "Writing Your First Linux Kernel Module: A Practical Guide"
description: "From zero to a working character device driver in the Linux kernel — covering module init, file operations, ioctl, and /proc integration with real working code."
date: "2024-09-08"
tags: ["Linux", "Kernel", "C", "LKM", "Drivers"]
category: "Kernel / OS"
---

# Writing Your First Linux Kernel Module

Linux kernel modules let you add functionality to the running kernel without rebooting. They're the entry point to kernel development — and far less terrifying than they sound.

## Setup

You'll need kernel headers for your running kernel:

```bash
# Debian/Ubuntu
sudo apt install linux-headers-$(uname -r) build-essential

# Verify
ls /lib/modules/$(uname -r)/build
```

## The Minimal Module

Every module needs `init` and `exit` functions:

```c
// hello.c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Aryan Sharma");
MODULE_DESCRIPTION("A minimal kernel module");

static int __init hello_init(void) {
    printk(KERN_INFO "hello: module loaded\n");
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "hello: module unloaded\n");
}

module_init(hello_init);
module_exit(hello_exit);
```

```makefile
# Makefile
obj-m += hello.o

all:
	make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules

clean:
	make -C /lib/modules/$(shell uname -r)/build M=$(PWD) clean
```

```bash
make
sudo insmod hello.ko
dmesg | tail -3    # should show "hello: module loaded"
sudo rmmod hello
```

<Callout type="warn">
Always use `printk` instead of `printf` in kernel code. The kernel has no C library. `KERN_INFO`, `KERN_ERR`, etc. are log level prefixes.
</Callout>

## A Character Device Driver

A char device gives userspace a file interface (`/dev/mydev`) to talk to your module.

```c
#include <linux/cdev.h>
#include <linux/fs.h>
#include <linux/uaccess.h>

#define DEVICE_NAME "mydev"
#define BUF_SIZE    256

static dev_t dev_num;
static struct cdev my_cdev;
static struct class *my_class;

static char kernel_buf[BUF_SIZE];
static size_t buf_len = 0;

// Called when userspace opens /dev/mydev
static int mydev_open(struct inode *inode, struct file *file) {
    pr_info("mydev: opened\n");
    return 0;
}

// Called on close
static int mydev_release(struct inode *inode, struct file *file) {
    pr_info("mydev: closed\n");
    return 0;
}

// Userspace reads from the device
static ssize_t mydev_read(struct file *file, char __user *ubuf,
                           size_t count, loff_t *ppos) {
    size_t to_copy = min(count, buf_len);
    if (copy_to_user(ubuf, kernel_buf, to_copy))
        return -EFAULT;
    return to_copy;
}

// Userspace writes to the device
static ssize_t mydev_write(struct file *file, const char __user *ubuf,
                            size_t count, loff_t *ppos) {
    size_t to_copy = min(count, (size_t)(BUF_SIZE - 1));
    if (copy_from_user(kernel_buf, ubuf, to_copy))
        return -EFAULT;
    buf_len = to_copy;
    kernel_buf[buf_len] = '\0';
    pr_info("mydev: received: %s\n", kernel_buf);
    return to_copy;
}

static struct file_operations fops = {
    .owner   = THIS_MODULE,
    .open    = mydev_open,
    .release = mydev_release,
    .read    = mydev_read,
    .write   = mydev_write,
};
```

The init function registers the device:

```c
static int __init mydev_init(void) {
    // Allocate a major:minor number dynamically
    if (alloc_chrdev_region(&dev_num, 0, 1, DEVICE_NAME) < 0)
        return -1;

    // Register cdev
    cdev_init(&my_cdev, &fops);
    if (cdev_add(&my_cdev, dev_num, 1) < 0) {
        unregister_chrdev_region(dev_num, 1);
        return -1;
    }

    // Create /dev/mydev automatically via udev
    my_class = class_create(THIS_MODULE, DEVICE_NAME);
    device_create(my_class, NULL, dev_num, NULL, DEVICE_NAME);

    pr_info("mydev: registered with major %d\n", MAJOR(dev_num));
    return 0;
}
```

## Testing with Python

```python
# test.py
with open('/dev/mydev', 'w') as f:
    f.write('hello from userspace')

with open('/dev/mydev', 'r') as f:
    print(f.read())
```

## Adding a /proc Entry

The `/proc` filesystem is great for exposing stats:

```c
#include <linux/proc_fs.h>
#include <linux/seq_file.h>

static int proc_show(struct seq_file *m, void *v) {
    seq_printf(m, "writes: %lu\nbuf_len: %zu\n", write_count, buf_len);
    return 0;
}

// In init:
proc_create_single("mydev_stats", 0, NULL, proc_show);

// In exit:
remove_proc_entry("mydev_stats", NULL);
```

```bash
cat /proc/mydev_stats
# writes: 3
# buf_len: 20
```

## Key Takeaways

- Never use userspace libc in kernel code
- Always use `copy_to_user`/`copy_from_user` — never dereference userspace pointers directly
- Memory allocated with `kmalloc` must be freed with `kfree` in your exit function
- Check every return value — a kernel panic is a bad user experience

Full source code is on [GitHub](https://github.com/yourusername/linux-modules). Next up: writing a netfilter hook for packet logging.

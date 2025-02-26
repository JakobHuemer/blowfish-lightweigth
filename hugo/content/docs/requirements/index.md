---
title: "Requirements"
description: "The tools required to run the App"
date: 2025-02-25
lastmod: 2025-02-25
slug: requirements
tags: ["docs", "installation"]
weight: 1
authors:
  - "jakob"
  - "miriam"
---

## Docker 🐳

```java
class MainClass {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

Running this application is a breeze with Docker! Our containerized approach ensures you'll avoid the dreaded "but it works on my machine" syndrome while keeping deployment silky smooth across all environments.

### Version & Resource Needs

Fire up Docker Engine 20.10.0+ and Docker Compose 2.0.0+ for the best experience. Your containers will purr nicely with 2GB+ RAM and at least 10GB of breathing room on disk.

### Network Magic

We've configured the application to use bridge networking with ports 8080 and 3306 ready to connect your world. Volume mounts are enabled so your precious data persists between container restarts - no surprises!

## Database Options 💾

### MySQL: The Reliable Workhorse

MySQL 8.0+ forms the backbone of our data storage strategy. We've carefully selected utf8mb4 encoding and utf8mb4_unicode_ci collation to handle everything from emoji 😎 to complex international characters without breaking a sweat.

### PostgreSQL: The Powerful Alternative

For the PostgreSQL enthusiasts, version 14.0+ is fully supported! We leverage the powerful pgcrypto and uuid-ossp extensions to keep your data secure and uniquely identified.

## Server Environment 🖥️

### Hardware That Makes Things Fly

• 2+ CPU cores to handle concurrent requests with ease
• 8GB RAM recommended for buttery-smooth operations
• 20GB SSD storage for lightning-fast data access

### OS Compatibility Without Compromise

Whether you're a Linux lover, Mac enthusiast, or Windows wizard, we've got you covered:
• Linux: Ubuntu 20.04 LTS or newer (our personal favorite!)
• macOS: Version 12+ for a polished experience
• Windows: 10/11 Pro/Enterprise with WSL2 for the best of both worlds

## Development Toolkit 🛠️

### Essential Software

Node.js 16 LTS, npm 8+, and Git 2.30+ create the perfect development trifecta. These time-tested tools ensure your code goes from concept to production without missing a beat.

### Productivity Boosters

Supercharge your workflow with Visual Studio Code's Docker extensions and use Postman to put your APIs through their paces before deployment!

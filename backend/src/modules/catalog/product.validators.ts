#!/usr/bin/env python3
import os
from pathlib import Path

# The project structure defined in a multi-line string.
# Folders are indicated by a trailing slash '/'.
structure = """
.
├─ package.json
├─ tsconfig.json
├─ .env
├─ .env.example
├─ Dockerfile
├─ docker-compose.yml
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ src/
│  ├─ index.ts
│  ├─ app.ts
│  ├─ routes.ts
│  ├─ config/
│  │  ├─ env.ts
│  │  └─ logger.ts
│  ├─ common/
│  │  ├─ middlewares/
│  │  │  ├─ errorHandler.ts
│  │  │  ├─ authGuard.ts
│  │  │  ├─ rateLimiter.ts
│  │  │  └─ requestLogger.ts
│  │  ├─ errors/
│  │  │  └─ AppError.ts
│  │  └─ utils/
│  │     ├─ crypto.ts
│  │     ├─ validation.ts
│  │     └─ http.ts
│  ├─ infrastructure/
│  │  ├─ db/
│  │  │  ├─ prismaClient.ts
│  │  │  └─ repositories/
│  │  │     ├─ user.repo.ts
│  │  │     ├─ product.repo.ts
│  │  │     ├─ cart.repo.ts
│  │  │     ├─ order.repo.ts
│  │  │     └─ payment.repo.ts
│  │  ├─ cache/
│  │  │  └─ redisClient.ts
│  │  ├─ queue/
│  │  │  └─ bullmq.ts
│  │  ├─ mail/
│  │  │  ├─ mailer.ts
│  │  │  └─ templates/
│  │  ├─ payment/
│  │  │  ├─ stripe.gateway.ts
│  │  │  └─ paypal.gateway.ts
│  │  ├─ storage/
│  │  │  └─ s3.storage.ts
│  │  └─ search/
│  │     └─ elastic.client.ts
│  ├─ events/
│  │  ├─ eventBus.ts
│  │  └─ handlers/
│  │     ├─ order.created.handler.ts
│  │     └─ payment.succeeded.handler.ts
│  ├─ modules/
│  │  ├─ auth/
│  │  │  ├─ auth.routes.ts
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ auth.service.ts
│  │  │  └─ auth.validators.ts
│  │  ├─ users/
│  │  │  ├─ user.routes.ts
│  │  │  ├─ user.controller.ts
│  │  │  ├─ user.service.ts
│  │  │  └─ user.entity.ts
│  │  ├─ catalog/
│  │  │  ├─ product.routes.ts
│  │  │  ├─ product.controller.ts
│  │  │  ├─ product.service.ts
│  │  │  ├─ product.validators.ts
│  │  │  ├─ product.entity.ts
│  │  │  └─ category.entity.ts
│  │  ├─ inventory/
│  │  │  ├─ inventory.routes.ts
│  │  │  ├─ inventory.controller.ts
│  │  │  └─ inventory.service.ts
│  │  ├─ pricing/
│  │  │  ├─ coupon.entity.ts
│  │  │  ├─ pricing.service.ts
│  │  │  └─ tax.service.ts
│  │  ├─ cart/
│  │  │  ├─ cart.routes.ts
│  │  │  ├─ cart.controller.ts
│  │  │  └─ cart.service.ts
│  │  ├─ checkout/
│  │  │  ├─ checkout.routes.ts
│  │  │  ├─ checkout.controller.ts
│  │  │  └─ checkout.service.ts
│  │  ├─ orders/
│  │  │  ├─ order.routes.ts
│  │  │  ├─ order.controller.ts
│  │  │  ├─ order.service.ts
│  │  │  └─ order.events.ts
│  │  ├─ payments/
│  │  │  ├─ payment.routes.ts
│  │  │  ├─ payment.controller.ts
│  │  │  └─ payment.service.ts
│  │  ├─ shipping/
│  │  │  ├─ shipping.routes.ts
│  │  │  ├─ shipping.controller.ts
│  │  │  └─ shipping.service.ts
│  │  ├─ reviews/
│  │  │  ├─ review.routes.ts
│  │  │  ├─ review.controller.ts
│  │  │  └─ review.service.ts
│  │  └─ notifications/
│  │     ├─ notification.routes.ts
│  │     ├─ notification.controller.ts
│  │     └─ notification.service.ts
│  └─ tests/
│     ├─ unit/
│     ├─ integration/
│     └─ e2e/
├─ scripts/
│  ├─ seed.ts
│  └─ migrate.ts
├─ .eslintrc.cjs
├─ .prettierrc
├─ jest.config.ts
└─ README.md
"""

def create_project_structure(base_path="."):
    """
    Parses the structure string and creates the corresponding directories and files.
    """
    lines = structure.strip().split('\n')
    path_stack = []

    for line in lines:
        # Ignore the root '.' line
        if line.strip() == ".":
            continue

        # Ignore lines that don't represent a file/folder entry
        if '─' not in line:
            continue

        # Calculate the depth/level of the current item by counting '│'
        depth = line.count('│')

        # Clean the line to get the name of the file or folder
        # Removes comments, tree characters, and whitespace
        name_part = line.split('─')[-1].strip()
        
        # Determine if it's a directory (ends with '/')
        is_dir = name_part.endswith('/')
        
        # Get the clean name by removing the trailing slash if it's a directory
        name = name_part.rstrip('/') if is_dir else name_part

        # Manage the path stack based on the current depth
        # This correctly places the item under its parent
        while len(path_stack) > depth:
            path_stack.pop()
        
        # Construct the full path for the current item
        current_path_parts = path_stack + [name]
        current_path = Path(base_path, *current_path_parts)

        try:
            if is_dir:
                current_path.mkdir(parents=True, exist_ok=True)
                print(f"Created directory: {current_path}")
                # Add the new directory to the stack for its children
                path_stack.append(name)
            else:
                # Ensure the parent directory exists before creating the file
                current_path.parent.mkdir(parents=True, exist_ok=True)
                current_path.touch(exist_ok=True)
                print(f"Created file:      {current_path}")
        except OSError as e:
            print(f"Error creating {current_path}: {e}")

if __name__ == "__main__":
    print("Starting to create project structure...")
    # You can specify a different root folder here, e.g., create_project_structure("my-new-app")
    create_project_structure()
    print("\nProject structure created successfully!")
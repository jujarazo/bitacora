# Bitacora – Project Guide

## Structure
- apps/web — React + Vite
- apps/api — NestJS
- packages/tsconfig — shared tsconfigs
- packages/types — shared types

## Commands
- Web:
    - dev: `bun --cwd apps/web run dev`
    - build: `bun --cwd apps/web run build`
    - test: `bun --cwd apps/web run test`
- API:
    - dev: `bun --cwd apps/api run dev`
    - build: `bun --cwd apps/api run build`
    - test: `bun --cwd apps/api run test`

## Conventions
- Use shared types from `packages/types`
- Never read `.env*` files; use mock envs during tests

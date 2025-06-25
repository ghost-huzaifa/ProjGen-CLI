# Angular Medical Dashboard

A modern medical dashboard application built with Angular, Angular Material, and TailwindCSS. This application provides a comprehensive solution for healthcare professionals to manage patients, messages, reports, and more.

## Features

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Angular Material UI**: Modern and accessible user interface component
- **Date Range Picker**: Filter data by custom date ranges
- **Multiple Modules**: Organized code structure for better maintainability

## Modules

- **Command Center**: Main dashboard with overview metrics
- **Messages**: Communication system between healthcare providers
- **Users**: User account management
- **Financial Dashboard**: Billing and financial reports
- **Reports**: Generate and view various medical reports
- **Settings**: Application configuration
- **Escalations**: Priority issue management
- **Roles & Permissions**: User access control
- **And more...**

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/angular--dashboard.git
   cd angular-dashboard
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:4200`

## Development

This project was generated with [Angular CLI](https://github.com/angular/angular-cli).

### Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Running unit tests

Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Project Structure

```
src/
├── app/
│   ├── core/           # Core modules, guards, services
│   ├── features/       # Feature modules (messages, users, etc.)
│   ├── layout/         # Layout components (navbar, sidebar, etc.)
│   ├── modules/        # Main application modules
│   └── shared/         # Shared components, pipes, directives
├── assets/             # Static assets
└── environments/       # Environment configurations
```

# DMD Shoes Back Office

A Next.js-based administration dashboard for DMD Shoes management.

## Features

- **Global Admin Layout**: Shared sidebar and topbar across all admin pages
- **Authentication Pages**: Separate layout for login, reset password, and confirmation pages
- **Dashboard**: Overview with statistics and quick actions
- **Content Management**: Products, articles, and customer management pages
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean interface with Tailwind CSS
- **Component-based**: Reusable topbar and sidebar components
- **Route Groups**: Organized using Next.js route groups for layout separation

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
back-office/
├── app/
│   ├── (admin)/              # Admin pages with shared layout
│   │   ├── dashboard/
│   │   │   └── page.tsx      # Dashboard page with stats
│   │   ├── products/
│   │   │   └── page.tsx      # Products management
│   │   ├── articles/
│   │   │   └── page.tsx      # Articles management
│   │   ├── customers/
│   │   │   └── page.tsx      # Customer management
│   │   └── layout.tsx        # Global admin layout with sidebar and topbar
│   ├── auth/                 # Authentication pages (no admin layout)
│   │   ├── login/
│   │   │   └── page.tsx      # Login page
│   │   ├── reset-password/
│   │   │   └── page.tsx      # Password reset page
│   │   └── password-changed/
│   │       └── page.tsx      # Password changed confirmation
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Root redirect to dashboard
├── components/
│   ├── Sidebar.tsx           # Navigation sidebar
│   └── Topbar.tsx            # Top navigation bar
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Components

### Sidebar
- Navigation menu with sections
- Icons for each menu item
- Active state highlighting
- Responsive design

### Topbar
- Page title display
- User profile section
- Action buttons

### Dashboard
- Statistics cards
- Recent activity feed
- Quick action buttons

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling framework
- **React**: UI library

## Development

The project uses Next.js App Router with TypeScript and Tailwind CSS for a modern development experience.
# AI Rules for Vehicle Inspection System

## Tech Stack

- **Next.js 15** - React framework with App Router for server-side rendering and static site generation
- **React 19** - Latest React version with modern hooks and concurrent features
- **TypeScript** - Type-safe JavaScript for better development experience and error prevention
- **Tailwind CSS v4** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - High-quality, customizable UI components built on Radix UI primitives
- **Supabase** - Open-source Firebase alternative for database, authentication, and real-time features
- **Lucide React** - Beautiful & consistent icon library for React applications
- **React Hook Form** - Performant, flexible, and extensible forms library with validation
- **Zod** - TypeScript-first schema validation for type-safe form handling
- **bcryptjs** - Password hashing library for secure user authentication
- **jsPDF + jspdf-autotable** - PDF generation library for creating inspection reports
- **Sonner** - Simple toast notifications for user feedback

## Library Usage Rules

### UI Components
- **Always use shadcn/ui components** when available - they provide consistent styling and accessibility
- **Import components directly** from `@/components/ui/` (e.g., `import { Button } from '@/components/ui/button'`)
- **Never create custom UI components** that duplicate existing shadcn/ui functionality
- **Use Tailwind CSS classes** for custom styling and layout modifications
- **Follow the existing design system** - use the color palette and spacing conventions

### Forms & Validation
- **Always use React Hook Form** for form handling - it provides better performance and easier validation
- **Always use Zod schemas** for form validation - create validation schemas in `src/lib/validations.ts`
- **Use the `@hookform/resolvers`** package to integrate Zod with React Hook Form
- **Never use controlled form inputs** without React Hook Form - it causes performance issues
- **Always include proper error handling** and user feedback for form validation

### Database & Authentication
- **Always use Supabase** for database operations and authentication
- **Import Supabase client** from `@/lib/supabase.ts` (e.g., `import { supabase } from '@/lib/supabase'`)
- **Always use Row Level Security (RLS)** for database access control
- **Never store sensitive data** in localStorage - use Supabase sessions instead
- **Always hash passwords** using bcryptjs before storing in the database

### State Management
- **Use React hooks** (`useState`, `useEffect`, `useContext`) for local state management
- **Never use global state libraries** like Redux or Zustand for this application size
- **Use Supabase real-time subscriptions** for collaborative features when needed
- **Keep state as close to the component** as possible to avoid unnecessary re-renders

### Styling
- **Always use Tailwind CSS classes** for styling - no CSS files or styled-components
- **Follow the existing color scheme** defined in `src/app/globals.css`
- **Use the CSS custom properties** for consistent theming
- **Never use inline styles** - always use Tailwind classes or CSS custom properties
- **Make all components responsive** using Tailwind's responsive utilities

### File Organization
- **Keep components in `src/components/`** - organize by feature (e.g., `src/components/admin/`)
- **Keep pages in `src/app/`** following Next.js App Router conventions
- **Keep utilities in `src/lib/`** - database functions, helpers, and constants
- **Keep types in `src/types/`** - TypeScript interfaces and type definitions
- **Use descriptive file names** - `employee-management.tsx` not `emp.tsx`

### Code Quality
- **Always write TypeScript** - no JavaScript files allowed
- **Always use ESLint** and follow the existing configuration
- **Always write JSDoc comments** for complex functions and components
- **Never use `any` type** - create proper TypeScript interfaces
- **Always handle errors gracefully** - use try/catch blocks and user-friendly error messages

### Performance
- **Always use React.memo** for expensive components that don't change often
- **Always use useCallback** for functions passed to child components
- **Always use useMemo** for expensive calculations
- **Never use inline functions** in JSX - they cause unnecessary re-renders
- **Always optimize images** using Next.js Image component

### Security
- **Always validate user input** on both client and server sides
- **Always use environment variables** for sensitive configuration
- **Never expose API keys** or secrets in client-side code
- **Always implement proper authentication** and authorization
- **Always use HTTPS** for all API requests

### Testing
- **Always write unit tests** for utility functions and complex logic
- **Always write integration tests** for API endpoints and database operations
- **Use Jest** and React Testing Library for testing
- **Always test error scenarios** and edge cases
- **Keep tests simple and focused** - one assertion per test when possible

### Development Workflow
- **Always use the existing project structure** - don't create new folders without approval
- **Always commit changes with clear messages** following conventional commits
- **Always run the linter** before committing code
- **Always test changes** in the development environment before deploying
- **Always document new features** in the README or relevant documentation
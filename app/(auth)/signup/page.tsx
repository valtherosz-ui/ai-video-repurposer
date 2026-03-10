import { AuthLayout } from '@/components/auth/AuthLayout'
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create an account"
      subtitle="Start transforming your videos today"
      backLink={{ href: '/', text: 'Back to home' }}
    >
      <SignupForm />
    </AuthLayout>
  )
}

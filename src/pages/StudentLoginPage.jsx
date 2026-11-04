import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

export default function StudentLoginPage() {
  return (
    <AuthLayout
      role="student"
      headline="Your next opportunity starts here."
      description="Discover meaningful research, connect with mentors, and turn your ideas into impactful projects."
      benefits={[
        'Discover cross-university opportunities.',
        'Showcase your skills and projects.',
        'Track your research applications.'
      ]}
    >
      <LoginForm
        role="student"
        heading="Student Login"
        subtitle="Welcome back! Sign in to continue your academic journey."
        emailLabel="Email Address"
        emailPlaceholder="you@university.edu"
        buttonText="Sign In"
        securityNote="Your academic journey deserves a secure space."
      />
    </AuthLayout>
  );
}

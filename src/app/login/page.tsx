'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from "sonner"
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [role, setRole] = useState('student')
  const [academicLevel, setAcademicLevel] = useState('100')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>, action: typeof login | typeof signup) => {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    // Manual state injection for role/level
    if (action === signup) {
      formData.set('role', role)
      if (role === 'student') {
        formData.set('academicLevel', academicLevel)
      }
    }

    // Execute server action
    const result = await action(formData)

    // If we reach here, it means there was likely an error (success redirects automatically)
    setIsLoading(false)

    if (result?.error) {
      toast.error(result.error)
    }
  }

  return (
    <div className="login-page">
      {/* LEFT SIDE — Form */}
      <div className="login-form-side">
        <div className="login-form-container">
          {/* Logo & Brand */}
          <div className="login-brand">
            <Image
              src="/logo.png"
              alt="Campus AI Logo"
              width={72}
              height={72}
              className="login-logo-img"
            />
            <span className="login-logo-text">Campus AI</span>
          </div>

          {/* Heading */}
          <div className="login-heading">
            <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
            <p>
              {mode === 'login'
                ? 'Sign in to access your AI-powered campus portal'
                : 'Join Campus AI and unlock your learning potential'}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => handleSubmit(e, mode === 'login' ? login : signup)}
            className="login-form"
          >
            {/* Full Name (signup only) */}
            {mode === 'signup' && (
              <div className="login-field" style={{ animationDelay: '0ms' }}>
                <Label htmlFor="fullName" className="login-label">Enter Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  className="login-input"
                />
              </div>
            )}

            {/* Email */}
            <div className="login-field" style={{ animationDelay: mode === 'signup' ? '50ms' : '0ms' }}>
              <Label htmlFor="login-email" className="login-label">Enter Email</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                required
                className="login-input"
              />
            </div>

            {/* Password */}
            <div className="login-field" style={{ animationDelay: mode === 'signup' ? '100ms' : '50ms' }}>
              <Label htmlFor="login-password" className="login-label">Enter Password</Label>
              <div className="login-password-wrap">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="login-input login-input-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role (signup only) */}
            {mode === 'signup' && (
              <div className="login-field" style={{ animationDelay: '150ms' }}>
                <Label className="login-label">I am a…</Label>
                <Select onValueChange={setRole} defaultValue="student">
                  <SelectTrigger className="login-input">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="lecturer">Lecturer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Level (signup + student only) */}
            {mode === 'signup' && role === 'student' && (
              <div className="login-field" style={{ animationDelay: '200ms' }}>
                <Label className="login-label">Academic Level</Label>
                <Select onValueChange={setAcademicLevel} defaultValue="100">
                  <SelectTrigger className="login-input">
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Remember / Forgot (login only) */}
            {mode === 'login' && (
              <div className="login-meta-row">
                <label className="login-checkbox-label">
                  <input type="checkbox" className="login-checkbox" />
                  <span>Keep me signed in</span>
                </label>
                <button type="button" className="login-forgot-btn">Forgot Password?</button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="login-submit-btn"
            >
              {isLoading ? (
                <span className="login-loading">
                  <span className="login-spinner" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                <span className="login-btn-content">
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="login-toggle-row">
            <span>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button
              type="button"
              className="login-toggle-btn"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — Splash Image (no text overlay) */}
      <div className="login-hero-side">
        <Image
          src="/splash_screen.jpg"
          alt="Graduates celebrating"
          fill
          className="login-hero-img"
          priority
        />
      </div>
    </div>
  )
}
// src/app/login/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const savedEmail = localStorage.getItem("nossa_conta_remember_email")
    const savedPass = localStorage.getItem("nossa_conta_remember_pass")
    const savedRemember = localStorage.getItem("nossa_conta_remember") === "true"
    if (savedRemember && savedEmail) {
      setEmail(savedEmail)
      if (savedPass) setPassword(savedPass)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    if (rememberMe) {
      localStorage.setItem("nossa_conta_remember_email", email)
      localStorage.setItem("nossa_conta_remember_pass", password)
      localStorage.setItem("nossa_conta_remember", "true")
    } else {
      localStorage.removeItem("nossa_conta_remember_email")
      localStorage.removeItem("nossa_conta_remember_pass")
      localStorage.setItem("nossa_conta_remember", "false")
    }

    const { data, error } = await authClient.signIn.email({
      email,
      password,
      rememberMe,
      callbackURL: "/dashboard",
    } as any)

    if (error) {
      setError(error.message || "Credenciais inválidas")
      setLoading(false)
    } else {
      router.push("/dashboard") // Vai para o sistema após logar
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F0EA] p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-heading text-[#1B2430]">Nossa Conta</CardTitle>
          <CardDescription>Acesse seu controle financeiro.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#1F6F5C]" />
                <span className="text-[#4A5160]">Lembrar senha (preenche automaticamente)</span>
              </label>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full bg-[#1F6F5C] hover:bg-[#154E41]" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-xs text-center text-[#8A8D82]">Não tem conta? <a href="/setup" className="text-[#1F6F5C] underline">Criar conta</a></p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
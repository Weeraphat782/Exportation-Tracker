'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('Attempting to log in...');

    try {
      console.log("Login attempt with:", email);
      
      // Direct login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log("Login response:", data, error);

      if (error) {
        setMessage(`Error: ${error.message}`);
        return;
      }

      if (data.session) {
        setMessage('Login successful! Redirecting...');
        // Store session manually as a backup
        localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
        // Force redirect
        window.location.href = '/shipping-calculator';
      } else {
        setMessage('No session returned. Something went wrong.');
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      setMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Simple Login</h1>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px',
          background: message.includes('Error') ? '#ffdddd' : '#ddffdd',
          border: '1px solid',
          borderColor: message.includes('Error') ? '#ff0000' : '#00ff00'
        }}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        
        <button 
          type="submit" 
          style={{ 
            width: '100%', 
            padding: '10px', 
            background: '#4285f4', 
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
} 
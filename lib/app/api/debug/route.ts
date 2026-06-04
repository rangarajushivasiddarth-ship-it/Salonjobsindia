import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    name: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD ? 'SET' : 'NOT SET',
  });
}
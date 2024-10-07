"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface AudioDownloaderProps {
  audioFiles: string[]
}

export default function AudioDownloader({ audioFiles }: AudioDownloaderProps) {
  const disabled: boolean = audioFiles?.length === 0

  return (
    <div>
      <Button disabled={disabled}>Download Files</Button>
    </div>
  )
}

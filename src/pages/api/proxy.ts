import type { NextApiRequest, NextApiResponse } from 'next'
import { URL } from 'url'

const ALLOWED_HOSTS = ['firebasestorage.googleapis.com', 'storage.googleapis.com']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { url } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url query parameter' })
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    return res.status(403).json({ error: 'Forbidden host' })
  }

  try {
    const response = await fetch(parsedUrl.toString())

    if (!response.ok) {
      return res.status(response.status).end()
    }

    const contentType = response.headers.get('content-type')
    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }

    const buffer = await response.arrayBuffer()
    res.status(200).send(Buffer.from(buffer))
  } catch (error) {
    console.error('Error proxying:', error)
    res.status(500).json({ error: 'Error proxying request' })
  }
}

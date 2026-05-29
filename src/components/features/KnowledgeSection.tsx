'use client'

import { useState, useEffect, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { KbFolder, KbFile } from '@/types'
import {
  Plus, Folder, FolderOpen, File, Upload, Trash2,
  ChevronRight, Download, FileText, Image, Film, Archive
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatFileSize } from '@/lib/utils'

interface KnowledgeSectionProps { businessId: string; title: string }

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <FileText size={16} />
  if (mimeType.startsWith('image/')) return <Image size={16} className="text-blue-500" />
  if (mimeType.startsWith('video/')) return <Film size={16} className="text-purple-500" />
  if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive size={16} className="text-yellow-500" />
  return <FileText size={16} className="text-gray-500" />
}

export function KnowledgeSection({ businessId, title }: KnowledgeSectionProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [folders, setFolders] = useState<KbFolder[]>([])
  const [files, setFiles] = useState<KbFile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<KbFolder[]>([])
  const [folderModal, setFolderModal] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    if (!user) return
    const [foldersRes, filesRes] = await Promise.all([
      supabase.from('kb_folders').select('*').eq('user_id', user.id).eq('business_id', businessId)
        .is('parent_id', currentFolder).order('name'),
      supabase.from('kb_files').select('*').eq('user_id', user.id).eq('business_id', businessId)
        .is('folder_id', currentFolder).order('created_at', { ascending: false }),
    ])
    setFolders(foldersRes.data || [])
    setFiles(filesRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (user) load()
  }, [user, currentFolder, businessId])

  const createFolder = async () => {
    if (!user || !folderName.trim()) return
    const { data } = await supabase.from('kb_folders').insert({
      user_id: user.id, business_id: businessId,
      name: folderName, parent_id: currentFolder,
    }).select().single()
    if (data) { setFolders(prev => [...prev, data]); toast.success('Папка создана!') }
    setFolderModal(false)
    setFolderName('')
  }

  const deleteFolder = async (id: string) => {
    await supabase.from('kb_folders').delete().eq('id', id)
    setFolders(prev => prev.filter(f => f.id !== id))
    toast.success('Папка удалена')
  }

  const navigateToFolder = (folder: KbFolder) => {
    setFolderPath(prev => [...prev, folder])
    setCurrentFolder(folder.id)
  }

  const navigateBack = (index: number) => {
    if (index < 0) {
      setFolderPath([])
      setCurrentFolder(null)
    } else {
      const newPath = folderPath.slice(0, index + 1)
      setFolderPath(newPath)
      setCurrentFolder(newPath[newPath.length - 1].id)
    }
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const path = `${user.id}/${businessId}/${currentFolder || 'root'}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('knowledge-base').upload(path, file)
      if (uploadError) throw uploadError
      const { data } = await supabase.from('kb_files').insert({
        user_id: user.id, business_id: businessId,
        folder_id: currentFolder, name: file.name,
        storage_path: path, file_size: file.size, mime_type: file.type,
      }).select().single()
      if (data) { setFiles(prev => [data, ...prev]); toast.success(`${file.name} загружен!`) }
    } catch (err: any) {
      toast.error(err.message || 'Ошибка загрузки')
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const downloadFile = async (file: KbFile) => {
    const { data } = await supabase.storage.from('knowledge-base').createSignedUrl(file.storage_path, 60)
    if (data?.signedUrl) {
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = file.name
      a.click()
    }
  }

  const deleteFile = async (file: KbFile) => {
    await supabase.storage.from('knowledge-base').remove([file.storage_path])
    await supabase.from('kb_files').delete().eq('id', file.id)
    setFiles(prev => prev.filter(f => f.id !== file.id))
    toast.success('Файл удалён')
  }

  return (
    <div className="flex flex-col flex-1">
      <Header
        title={title}
        subtitle="База знаний и документы"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setFolderModal(true)}>
              <Plus size={16} /> Папка
            </Button>
            <Button size="sm" loading={uploading} onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Загрузить
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={uploadFile} />
          </div>
        }
      />

      <div className="p-4 md:p-6 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => { setFolderPath([]); setCurrentFolder(null) }}
            className={`font-medium transition-colors ${currentFolder ? 'text-primary-600 dark:text-primary-400 hover:underline' : 'text-gray-900 dark:text-gray-100'}`}
          >
            {title}
          </button>
          {folderPath.map((folder, i) => (
            <span key={folder.id} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-gray-400" />
              <button
                onClick={() => navigateBack(i)}
                className={`font-medium transition-colors ${i < folderPath.length - 1 ? 'text-primary-600 dark:text-primary-400 hover:underline' : 'text-gray-900 dark:text-gray-100'}`}
              >
                {folder.name}
              </button>
            </span>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : folders.length === 0 && files.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
            <p className="text-4xl mb-3">📁</p>
            <p className="text-gray-500 font-medium">Папка пуста</p>
            <p className="text-gray-400 text-sm mt-1">Создайте папку или загрузите файлы</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
            {/* Folders */}
            {folders.map((folder) => (
              <Card key={folder.id} hover>
                <CardContent className="p-3 group">
                  <div
                    className="cursor-pointer"
                    onDoubleClick={() => navigateToFolder(folder)}
                    onClick={() => navigateToFolder(folder)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Folder size={32} className="text-yellow-400" />
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id) }}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{folder.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Папка</p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Files */}
            {files.map((file) => (
              <Card key={file.id} hover>
                <CardContent className="p-3 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      {getFileIcon(file.mime_type)}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => downloadFile(file)} className="p-1 rounded text-gray-400 hover:text-primary-500 transition-colors">
                        <Download size={12} />
                      </button>
                      <button onClick={() => deleteFile(file)} className="p-1 rounded text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" title={file.name}>{file.name}</p>
                  {file.file_size && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatFileSize(file.file_size)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={folderModal} onClose={() => setFolderModal(false)} title="Новая папка" size="sm">
        <div className="space-y-4">
          <Input label="Название папки" placeholder="Название..." value={folderName} onChange={e => setFolderName(e.target.value)} autoFocus />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setFolderModal(false)}>Отмена</Button>
            <Button className="flex-1" onClick={createFolder}>Создать</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

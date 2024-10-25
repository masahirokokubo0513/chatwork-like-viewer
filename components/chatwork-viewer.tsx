"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Upload, Users, Info, Trash2, X } from "lucide-react"

interface Message {
  id: string
  aid: number
  msg: string
  type: string
  tm: number
  utm: number
  index: number
  system_message_dat?: {
    message: string
  }
  datetime: string
  aid_name: string
}

interface Room {
  id: string
  name: string
  messages: Message[]
}

export function ChatworkViewer() {
  const [rooms, setRooms] = React.useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [globalSearchTerm, setGlobalSearchTerm] = React.useState("")
  const [activeGlobalSearchTerm, setActiveGlobalSearchTerm] = React.useState("")
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false)
  const [isMembersModalOpen, setIsMembersModalOpen] = React.useState(false)
  const [selectedMessageId, setSelectedMessageId] = React.useState<string | null>(null)
  const messageRef = React.useRef<HTMLDivElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target?.result as string)
            const fileName = file.name
            const [roomId, roomName] = fileName.split('_')
            const newRoom: Room = {
              id: roomId,
              name: roomName.replace('_messages.json', ''),
              messages: json.map((message: Message) => ({ ...message, roomId }))
            }
            setRooms(prevRooms => [...prevRooms, newRoom])
            if (!selectedRoom) {
              setSelectedRoom(newRoom)
            }
          } catch (error) {
            console.error("JSONの解析に失敗しました:", error)
            alert("JSONファイルの読み込みに失敗しました。")
          }
        }
        reader.readAsText(file)
      })
    }
  }

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId))
    if (selectedRoom?.id === roomId) {
      setSelectedRoom(null)
    }
  }

  const filteredMessages = selectedRoom?.messages.filter(
    (message) =>
      message.msg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.aid_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const globalSearchResults = React.useMemo(() => {
    if (!activeGlobalSearchTerm) return []
    return rooms.flatMap(room =>
      room.messages.filter(message =>
        message.msg.toLowerCase().includes(activeGlobalSearchTerm.toLowerCase()) ||
        message.aid_name.toLowerCase().includes(activeGlobalSearchTerm.toLowerCase())
      ).map(message => ({ ...message, roomName: room.name, roomId: room.id }))
    )
  }, [rooms, activeGlobalSearchTerm])

  const uniqueMembers = React.useMemo(() => {
    if (!selectedRoom) return []
    const members = new Map<number, { name: string; avatar: string }>()
    selectedRoom.messages.forEach(message => {
      if (!members.has(message.aid) && message.type === "text_message_type") {
        members.set(message.aid, { name: message.aid_name, avatar: message.aid_name[0] })
      }
    })
    return Array.from(members.values())
  }, [selectedRoom])

  const handleMessageClick = (roomId: string, messageId: string) => {
    setSelectedRoom(rooms.find(room => room.id === roomId) || null)
    setSelectedMessageId(messageId)
    setIsSearchModalOpen(false)
  }

  React.useEffect(() => {
    if (selectedMessageId && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' })
      setSelectedMessageId(null)
    }
  }, [selectedMessageId])

  const renderMessage = (message: Message, isSearchResult = false, roomId?: string) => {
    const messageElement = (
      <div 
        ref={message.id === selectedMessageId ? messageRef : null}
        className={`${message.id === selectedMessageId ? 'bg-yellow-100 dark:bg-yellow-900' : ''} ${isSearchResult ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : ''}`}
        onClick={isSearchResult && roomId ? () => handleMessageClick(roomId, message.id) : undefined}
      >
        {message.type === "create_room_message_type" || message.type === "update_room_message_type" ? (
          <div className="flex items-start bg-muted p-2 rounded-md">
            <Info className="mr-2 h-4 w-4 flex-shrink-0 mt-1" />
            <span className="text-sm text-muted-foreground break-words">{message.system_message_dat?.message}</span>
          </div>
        ) : (
          <div className="flex items-start">
            <Avatar className="mr-2">
              <AvatarFallback>{message.aid_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-baseline">
                <span className="font-semibold mr-2">{message.aid_name}</span>
                <span className="text-xs text-muted-foreground">{message.datetime}</span>
              </div>
              <p className="mt-1 break-words">{message.msg}</p>
            </div>
          </div>
        )}
      </div>
    )
    return messageElement
  }

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setActiveGlobalSearchTerm(globalSearchTerm)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="w-64 border-r bg-muted flex flex-col">
        <div className="p-4 flex-grow overflow-hidden">
          <h2 className="mb-4 text-lg font-semibold">ルーム一覧</h2>
          <ScrollArea className="h-[calc(100%-4rem)]">
            <div className="space-y-2">
              {rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between">
                  <Button
                    variant={selectedRoom?.id === room.id ? "secondary" : "ghost"}
                    className="w-full justify-start truncate"
                    onClick={() => setSelectedRoom(room)}
                  >
                    {room.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRoom(room.id)}
                    aria-label={`${room.name}を削除`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="p-4">
          <Input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
            id="json-upload"
            multiple
          />
          <Button variant="outline" className="w-full" asChild>
            <label htmlFor="json-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              JSONをアップロード
            </label>
          </Button>
        </div>
      </aside>
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b p-4">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">{selectedRoom?.name || "ルームを選択してください"}</h1>
            <Separator orientation="vertical" className="mx-4 h-6" />
            <Dialog open={isMembersModalOpen} onOpenChange={setIsMembersModalOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  メンバー
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>メンバー一覧</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="grid grid-cols-2 gap-4">
                    {uniqueMembers.map((member, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarFallback>{member.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Search className="mr-2 h-4 w-4" />
                  全体検索
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>全体検索</DialogTitle>
                </DialogHeader>
                <div className="flex items-center space-x-2 my-4">
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="検索キーワードを入力し、Enterを押してください..."
                    value={globalSearchTerm}
                    onChange={(e) => setGlobalSearchTerm(e.target.value)}
                    onKeyDown={handleGlobalSearch}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setGlobalSearchTerm("")
                      setActiveGlobalSearchTerm("")
                    }}
                    aria-label="検索をクリア"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList>
                    <TabsTrigger value="chat">チャット別</TabsTrigger>
                    <TabsTrigger value="time">時系列別</TabsTrigger>
                    <TabsTrigger value="user">人別</TabsTrigger>
                  </TabsList>
                  <div className="flex-1 overflow-hidden mt-4">
                    <TabsContent value="chat" className="h-full">
                      <ScrollArea className="h-full">
                        <div className="pr-4">
                          {rooms.map(room => (
                            <div key={room.id} className="mb-4">
                              <h3 className="font-semibold mb-2">{room.name}</h3>
                              {globalSearchResults
                                .filter(message => message.roomName === room.name)
                                .map(message => (
                                  <div key={message.id} className="mb-2">
                                    {renderMessage(message, true)}
                                  </div>
                                ))}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="time" className="h-full">
                      <ScrollArea className="h-full">
                        <div className="pr-4">
                          {globalSearchResults
                            .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
                            .map(message => (
                              <div key={message.id} className="mb-2">
                                <div className="text-sm text-muted-foreground mb-1 break-words">{message.roomName}</div>
                                {renderMessage(message, true)}
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="user" className="h-full">
                      <ScrollArea className="h-full">
                        <div className="pr-4">
                          {Object.entries(
                            globalSearchResults.reduce((acc, message) => {
                              if (!acc[message.aid_name]) {
                                acc[message.aid_name] = []
                              }
                              acc[message.aid_name].push(message)
                              return acc
                            }, {} as Record<string, typeof globalSearchResults>)
                          ).map(([user, messages]) => (
                            <div key={user} className="mb-4">
                              <h3 className="font-semibold mb-2 break-words">{user}</h3>
                              {messages.map(message => (
                                <div key={message.id} className="mb-2">
                                  <div className="text-sm text-muted-foreground mb-1 break-words">{message.roomName}</div>
                                  {renderMessage(message, true)}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </div>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="メッセージを検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="pr-4">
                {filteredMessages?.map((message) => (
                  <div key={message.id} className="mb-4">
                    {renderMessage(message)}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  )
}

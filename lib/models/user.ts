export interface User {
  id: string
  email: string
  spaces?: UserSpace[]
  role?: string
}

interface UserSpace {
  id: string
  role: string
}

import { User } from '../models/user'

export const mockUser: User = {
  email: 'bruce@notbatman.com',
  id: 'user-12345-67890',
  spaces: [
    {
      id: 'foolish-quail-hash',
      role: 'Super Admin',
    },
    {
      id: 'green-matter-hash',
      role: 'Admin',
    },
    {
      id: 'greasy-eggs-hash',
      role: 'Developer',
    },
  ],
}

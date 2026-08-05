import { HashMap } from './hashmap.js'

type HashMapExport = typeof HashMap & { HashMap: typeof HashMap }

const exported = HashMap as HashMapExport
exported.HashMap = HashMap

export { HashMap }
export default exported

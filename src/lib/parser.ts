import { buildSchema } from 'graphql'

export const createDefs = (typeDefs: string) => {
  const schema = buildSchema(typeDefs)
  const Node = schema.getType('Node')
  const Edge = schema.getType('Edge')

  const Types = schema.getTypeMap()
  const GraphTypes = Object.keys(Types).filter(name => {
    const Type = Types[name] as any
    const hasNode = Type.getInterfaces().includes(Node)
    debugger
    return hasNode
  })

  // console.log(GraphTypes)

  return typeDefs
}
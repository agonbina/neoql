import {
  buildSchema,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLID,
  GraphQLInterfaceType,
  GraphQLDirective,
  printType,
  printSchema
} from 'graphql'
import { concatenateTypeDefs } from 'graphql-tools'
import { mergeTypes } from 'merge-graphql-schemas'
import { getNullableType } from 'graphql/type'
import SchemaType from './entities/SchemaType'

export const createDefs = (typeDefs: string) => {
  const schema = buildSchema(typeDefs)
  const Node = schema.getDirective('node')

  const Types = schema.getTypeMap()
  const SchemaTypes = Object.keys(Types).map(name => {
    return Types[name] as any
  }).filter(Type => {
    if (Type instanceof GraphQLObjectType && Type.astNode) {
      const { directives = [] } = Type.astNode
      const isNode = !!directives.find(directive => directive.name.value === 'node')
      return isNode
    }
    return false
  }).map(Type => new SchemaType(Type))

  if (!SchemaTypes.length) {
    return typeDefs
  }

  let queryFields = {}
  let mutationFields = {}

  SchemaTypes.forEach(type => {
    queryFields = { ...queryFields, ...type.queries }
    mutationFields = { ...mutationFields, ...type.mutations }
  })

  const Query = new GraphQLObjectType({
    name: 'Query',
    fields: queryFields
  })
  const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: mutationFields
  })

  return mergeTypes([
    typeDefs,
    printType(Query),
    printType(Mutation)
  ])
}
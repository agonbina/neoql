import { readFileSync } from 'fs'
import * as path from 'path'
import { DirectiveNode, buildSchema } from 'graphql'
import {
  makeExecutableSchema,
  forEachField,
  addSchemaLevelResolveFunction
} from 'graphql-tools'
import { getArgumentValues } from 'graphql/execution/values'
import { createDefs } from './parser'

import resolvers from './resolvers'

const typeDefs = readFileSync(path.resolve(__dirname, 'schema.graphqls'), 'utf8')
const schema = makeExecutableSchema({
  allowUndefinedInResolve: false,
  typeDefs: createDefs(typeDefs),
  resolvers
})

const directiveResolvers = {
  default (result: any, _: any, args: any) {
    const { value } = args
    return result || value
  },
  slugify (result: string) {
    const slugified = result + '-slugified'
    return slugified
  }
}

forEachField(schema, (field: any) => {
  const directives = field.astNode.directives as DirectiveNode[]

  directives.forEach(directive => {
    const directiveName = directive.name.value
    const resolver: any = directiveResolvers[directiveName]

    if (resolver) {
      const oldResolve = field.resolve
      const Directive = schema.getDirective(directiveName)
      const args = getArgumentValues(Directive, directive)

      field.resolve = function () {
        const [ source, _, context, info ] = arguments
        let promise = oldResolve.call(field, ...arguments)

        // If you return a primitive from the default resolver
        const isPrimitive = !(promise instanceof Promise)
        if (isPrimitive) {
          promise = Promise.resolve(promise)
        }

        return promise.then(result => resolver(result, source, args, context, info))
      }
    }
  })
})

addSchemaLevelResolveFunction(schema, (source, args, context, info) => {
  console.log(info.operation)
})

export default schema

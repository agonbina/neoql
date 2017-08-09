import {
  GraphQLField,
  GraphQLFieldMap,
  GraphQLInputFieldMap,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLNonNull,
  getNullableType,
  getNamedType,
  GraphQLID,
  GraphQLScalarType,
  isCompositeType,
} from 'graphql'
import { Node } from 'neo4j-driver/types/v1/graph-types'
import { omit, without } from 'ramda'

type Mutation = 'create' | 'update' | 'remove'

class SchemaType<TSource, TContext> {
  idField: GraphQLField<TSource, TContext>
  propertyFields: GraphQLFieldMap<TSource, TContext>

  constructor(private Type: GraphQLObjectType) {
    const idField = this.scalarFields.find(field => {
      const nullableType = getNullableType(field.type)
      return nullableType.name === 'ID'
    })

    if (!idField) {
      throw new Error(`No idField used for ${Type.name}`)
    }

    this.idField = idField
    this.propertyFields = omit([idField.name], Type.getFields())
    console.log(this.relationshipFields)
  }

  get fields() {
    const fields = this.Type.getFields()
    return Object.keys(fields).map(name => fields[name])
  }

  get scalarFields() {
    return this.fields.filter(
      field => getNullableType(field.type) instanceof GraphQLScalarType
    )
  }

  get relationshipFields() {
    const others = without(this.scalarFields, this.fields)
    return others.filter(field => {
      const namedType = getNamedType(field.type)
      const { directives = [] } = namedType.astNode
      if (!directives.length) {
        return false
      }
      return (
        directives.findIndex(
          directive => directive.name.value === 'relationship'
        ) > -1
      )
    })
  }

  get scalarFieldsMap() {
    return this.scalarFields.reduce<
      GraphQLFieldMap<TSource, TContext>
    >((all, field) => {
      all[field.name] = field
      return all
    }, {})
  }

  get optionalFieldsMap(): GraphQLFieldMap<TSource, TContext> {
    const fieldNames = this.fieldNames(this.scalarFieldsMap)
    return fieldNames.reduce<
      GraphQLFieldMap<TSource, TContext>
    >((optionals, name) => {
      const field = this.scalarFieldsMap[name]
      const nullableType = getNullableType(field.type)
      optionals[name] = {
        ...field,
        type: nullableType,
      }
      return optionals
    }, {})
  }

  fieldNames(fields = this.Type.getFields()) {
    return Object.keys(fields)
  }

  get queries() {
    const { idField, Type } = this
    const { name } = Type
    const idArgs = {
      [idField.name]: { type: idField.type },
    }
    return {
      [name]: {
        type: new GraphQLNonNull(Type),
        args: {
          ...idArgs,
        },
      },
    }
  }

  get mutations() {
    const { idField, Type } = this
    const { name } = Type
    const idArgs = {
      [idField.name]: { type: idField.type },
    }
    return {
      [`create${name}`]: {
        type: new GraphQLNonNull(Type),
        args: {
          ...idArgs,
          ...this.scalarFieldsMap,
        },
      },
      [`update${name}`]: {
        type: new GraphQLNonNull(Type),
        args: {
          ...idArgs,
          ...this.optionalFieldsMap,
        },
      },
      [`remove${name}`]: {
        type: new GraphQLNonNull(Type),
        args: {
          ...idArgs,
        },
      },
    }
  }

  // getQuery (name: string) {
  //   const fullName = `${name}${this.Type.name}`
  //   return this.queries[this.Type.name]
  // }

  getMutation(name: Mutation) {
    const fullName = `${name}${this.Type.name}`
    return this.mutations[fullName]
  }
}

export default SchemaType

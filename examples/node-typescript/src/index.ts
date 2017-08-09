import * as express from 'express'
import * as bodyParser from 'body-parser'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'

import schema from './schema'

const PORT = 3000
const app = express()

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }))
app.use('/graphiql', graphiqlExpress({ endpointURL: 'http://localhost:3000/graphql' }))

app.listen(PORT, (error) => {
  if (error) {
    console.log(error)
  } else {
    console.log('Server running on PORT: ', PORT)
  }
})

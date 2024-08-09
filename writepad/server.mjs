'use strict';

import { Server } from '@hocuspocus/server'

const server = Server.configure({
  port: process.env.WRITEPAD_PORT || 9090,
})

server.listen()

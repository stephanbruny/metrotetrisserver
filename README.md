metrotetrisserver
=================

Simple UDP server for gaming purposes written in Node.JS

Info
----

This is the most basic solution for UDP data transfere between multiple clients.
The server accepts any connection with the proper opcodes and connects the first two available clients with each other.
It uses a primitive protocoll and form of data exchange is not controlled.

Methods
-------

- CONNECT - Connect to the server (Response: WAIT)
- RETRY - Find a free client and connect (Responses: WAIT or CONNECT_TO <client>)
- WORLD <data> - Send any data to connected client (no response)
- QUIT - Leave session (WAIT response to connected client)

Messages
--------

- UNKNOWN - client is unknown and must use CONNECT first before receiving any data
- WAIT - there is no free player so client must wait
- CONNECT_TO <client> - found connection
- WORLD <data> - received data from connected client

Installation
------------

To install the server you need Nodejs (>= 0.10.xx).
Then download the package and run "node server.js"

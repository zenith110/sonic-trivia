module sonic-trivia/backend/protos/protosconnect

go 1.25.5

require (
	connectrpc.com/connect v1.19.1
	sonic-trivia/backend/protos v0.0.0-00010101000000-000000000000
)

require google.golang.org/protobuf v1.36.11 // indirect

replace sonic-trivia/backend/protos => ../

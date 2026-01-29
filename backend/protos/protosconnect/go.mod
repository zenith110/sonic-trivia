module sonic-trivia/backend/protos/protosconnect 
ECHO is off.
go 1.24.0 
ECHO is off.
require \( 
$'\t'connectrpc.com/connect v1.19.1 
$'\t'sonic-trivia/backend/protos v0.0.0-00010101000000-000000000000 
\) 
ECHO is off.
require google.golang.org/protobuf v1.36.11 // indirect 
ECHO is off.
replace sonic-trivia/backend/protos =\

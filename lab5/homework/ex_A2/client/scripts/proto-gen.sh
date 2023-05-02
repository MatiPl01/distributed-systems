#!/usr/bin/env sh

yarn proto-loader-gen-types --grpcLib=@grpc/grpc-js --outDir=generated/ proto/*.proto

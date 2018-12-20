#!/bin/bash

# exit on first sign of error:
set -e

# nabbed from SO; cd to directory project lives in:
cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

MODE=release
DIST_DIR="dist"
TARG_DIR="target/wasm32-unknown-unknown/${MODE}"

#
# Create necessary folders and clean them
#

mkdir -p "${DIST_DIR}"
rm -f ${DIST_DIR}/*

#
#  WASM stuff
#

# update (in release mode) the wasm:
cargo build --target wasm32-unknown-unknown --${MODE}

# update the wasm bindings:
wasm-bindgen ${TARG_DIR}/rust_web_rtrt.wasm --no-modules --no-modules-global rayTracer --no-typescript --out-dir js/wasm
cp js/wasm/rust_web_rtrt_bg.wasm ${DIST_DIR}


#
# Build the Web Main JS files
#


MAIN_JS="js/index.js js/ManageRayTracing.js"
browserify ${MAIN_JS} -o ${DIST_DIR}/main.js

COMMON_JS="js/common/*.js"
browserify ${COMMON_JS}   -o ${DIST_DIR}/common.js

WORKER_JS="js/jsrt/RayTraceWorker.js"
browserify ${WORKER_JS}   -o ${DIST_DIR}/JSRayTraceWorker.js

WORKER_WASM="js/wasm/RayTraceWorker.js"
browserify ${WORKER_WASM}   -o ${DIST_DIR}/WasmRayTraceWorker.js

cp js/index.html ${DIST_DIR}


# Clean up
rm js/wasm/rust_web_rtrt_bg.wasm
rm js/wasm/rust_web_rtrt.js

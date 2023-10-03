/**
 * This file contains the startNode function, which is used to start a node.
 * It requires the child_process, graceful-goodbye, and kill-with-style packages.
 * The startNode function takes a key pair, a prefix, an IPCNAME, and optional arguments.
 * It starts a child process using the npx command with the specified prefix and IPCNAME.
 * It sets environment variables for SERVERKEY, CALLKEY, and IPCNAME.
 * It handles graceful shutdown of the child process using graceful-goodbye and kill-with-style.
 */
const {
  spawn
} = require("child_process");
const goodbye = require("graceful-goodbye");
const kill = require("kill-with-style");

/**
 * Function to start a node
 * @param {Object} keyPair - Key pair generated using hypercore-crypto or keypear
 * @param {string} prefix - Prefix for the IPC command
 * @param {string} ipcName - Name of the IPC (Inter-Process Communication) call
 * @param {Array} args - Optional arguments for the npx command
 */
const startNode = async (keyPair, prefix, ipcName, args = []) => {
  const node = require("hyper-ipc-secure")();

  // Log the public key and IPCNAME of the node being started
  console.log("Starting node:", node.getSub(keyPair, ipcName).publicKey.toString("hex"), ipcName);

  // Convert SERVERKEY and CALLKEY to hex strings
  const SERVERKEY = Buffer.from(JSON.stringify(node.getSub(keyPair, "firstnode"))).toString("hex");
  const CALLKEY = Buffer.from(JSON.stringify(node.getSub(keyPair, ipcName))).toString("hex");

  // Start the child process using the npx command
  const child = spawn("npx", ["-y", prefix + ipcName + "@latest", ...args], {
    shell: true,
    stdio: "inherit",
    env: {
      ...process.env,
      SERVERKEY: SERVERKEY,
      CALLKEY: CALLKEY,
      IPCNAME: ipcName
    },
  });

  // Handle graceful shutdown of the child process
  goodbye(async () => {
    console.log("Stopping node:", node.getSub(keyPair, ipcName).publicKey.toString("hex"), ipcName);
    await new Promise((res) => {
      kill(child.pid, {
        signal: ["SIGINT", "SIGKILL"],
        retryCount: 1,
        retryInterval: 1e4,
        timeout: 11e3
      }, res);
    });
  });
};

module.exports = startNode;
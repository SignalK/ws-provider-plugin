/*
 * Copyright 2017 Teppo Kurki <teppo.kurki@iki.fi>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const debug = require('debug')('signalk-ws-plugin-provider')
const SignalK = require('@signalk/client')

module.exports = function(app) {
  var plugin = {}

  plugin.start = function(props, restart) {
    var hosts = props.hosts ||  []
    debug("starting with props " + JSON.stringify(props))
    const signalkClient = new SignalK.Client()

    signalkClient.on('discovery', discovery => {
      debug(discovery)
      var discoveredHost = discovery.host + ':' + discovery.port
      if(hosts.filter(hostSpec => hostSpec.host === discoveredHost).length === 0) {
        hosts.push({
          active: false,
          host: discoveredHost
        })
        signalkClient.stopDiscovery()
        props.hosts = hosts
        debug(props)
        restart(props)
      }
    })
    debug("Starting discovery")
    signalkClient.startDiscovery()

    hosts.forEach(hostSpec => {
      if(hostSpec.enabled) {
        debug("Connecting to " + hostSpec.host)
        var aClient = new SignalK.Client()
        signalkClient.connectDeltaByUrl(
          "ws://" + hostSpec.host + "/signalk/v1/stream?subscribe=all",
          (delta) => {
            if(delta.updates) {
              app.signalk.addDelta.call(app.signalk, delta)
            }
          },
          (connection) => {
            debug("Connected to " + hostSpec.host)
          },
          () => {
            debug("Disconnected from " + hostSpec.host)
          },
          (err) => {
            console.error(err)
          })
      }
    })
    debug("started")
  }

  plugin.stop = function() {
    debug("stopping")
    debug("stopped")
  };

  plugin.id = "signalk-ws-provider"
  plugin.name = "Signal K WebSocket Provider"
  plugin.description = "Plugin that can connect to another Signal K server and pipe data from it"

  plugin.schema = {
    type: "object",
    properties: {
      hosts: {
        title: "Hosts",
        type: "array",
        items: {
          type: "object",
          properties: {
            enabled: {
              type: "boolean",
              title: "Active"
            },
            host: {
              type: "string",
              title: "Host",
              default: "host:port"
            }
          }
        }
      }
    }
  }

  return plugin;
}

type ApplicableIOConf =
  'broadcast'
  'mongo'
  

export const sightIOConfigurations: { [server in ApplicableIOConf]?: { [service: string]: number } } = {
  broadcast: { https: 1010 }
  
}
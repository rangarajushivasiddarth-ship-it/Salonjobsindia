declare module 'ssh2-sftp-client' {
  class Client {
    connect(config: {
      host: string
      port?: number
      username: string
      password?: string
      privateKey?: Buffer
    }): Promise<Client>

    end(): Promise<void>
    stat(path: string): Promise<any>
    mkdir(path: string, recursive?: boolean): Promise<void>
    put(input: Buffer | NodeJS.ReadableStream, remotePath: string): Promise<string>
    delete(remotePath: string): Promise<void>
    get(remotePath: string): Promise<Buffer>
    list(remotePath: string, pattern?: string): Promise<any[]>
  }

  export default Client
}

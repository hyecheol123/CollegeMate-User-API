/**
 * Configuration for the Server
 *
 * This file contains important credentials.
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

import {
  AzureAppRegistrationObj,
  ConfigObj,
  DbObj,
  JwtKeyObj,
  ServerDomainPathObj,
} from './datatypes/ConfigObj';

/**
 * Module contains the configuration
 * Need to implement hash function
 */
export default abstract class ServerConfigTemplate {
  readonly db: DbObj;
  readonly expressPort: number;
  readonly jwt: JwtKeyObj;
  readonly domainPath: ServerDomainPathObj;
  readonly applicationKey: string[];
  readonly webpageOrigin: string;
  readonly serverApplicationKey: string;
  readonly serverAdminKey: string;
  readonly azureAppRegistrationInfo: AzureAppRegistrationObj;

  /**
   * Constructor for ServerConfig Object
   *
   * @param config configuration parameters will given by an object
   */
  protected constructor(config: ConfigObj) {
    this.db = config.db;
    this.expressPort = config.expressPort;
    this.jwt = config.jwtKeys;
    this.domainPath = config.serverDomainPath;
    this.applicationKey = config.applicationKey;
    this.webpageOrigin = config.webpageOrigin;
    this.serverApplicationKey = config.serverApplicationKey;
    this.serverAdminKey = config.serverAdminKey;
    this.azureAppRegistrationInfo = config.azureAppRegistrationInfo;
  }
}

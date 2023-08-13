/**
 * Configuration example for the Server.
 * Need to create ServerConfig.ts by copying this file.
 *
 * ServerConfig.ts file contains important credentials.
 * Should not be uploaded to version control system (git).
 *
 * @author Hyecheol (Jerry) Jang
 */

import {ConfigObj} from './datatypes/ConfigObj';
import ServerConfigTemplate from './ServerConfigTemplate';

/**
 * Module contains the configuration
 */
export default class ServerConfig extends ServerConfigTemplate {
  /**
   * Constructor for ServerConfig
   *
   * @param dbEndpoint {string} database endpoint url
   * @param dbKey {string} primary key to access the CosmosDB Server
   * @param dbId {string} database key to identify db
   */
  /* istanbul ignore next */
  constructor(dbEndpoint: string, dbKey: string, dbId: string) {
    const config: ConfigObj = {
      db: {
        endpoint: dbEndpoint,
        key: dbKey,
        databaseId: dbId,
      },
      expressPort: 3000,
      webpageOrigin: 'https://collegemate.app',
      applicationKey: ['<Android-App-v1>', '<iOS-App-v1>'],
      serverApplicationKey: '<API-Servers>',
      jwtKeys: {secretKey: 'keySecret'},
      serverDomainPath: {domain: 'api.collegemate.app'},
      serverAdminKey: '',
      azureAppRegistrationInfo: {
        clientId: '',
        tenantId: '',
        clientSecret: '',
        userObjectId: '',
        noReplyEmailAddress: '',
        mainEmailAddress: '',
      },
    };
    super(config);
  }
}

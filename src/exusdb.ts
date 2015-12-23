
import { sprintf } from 'sprintf-js';
import * as config from './config';

import * as pgplib from 'pg-promise';
import * as monitor from 'pg-monitor';

var connection: PgPromise.Database = undefined;
var options = { };
var pgp = pgplib(options);

var pg_connection = <string>process.env['DATABASE_URL'] || <PgPromise.ConnectionOption>config['db'];

export function connect() {
    connection = pgp(pg_connection);
}

export function close() {
    if (connection) {
        connection.end();
        connection = undefined;
    }
}

export function db() { return connection; }

export namespace error {
    export function notFound (reason: string) {
        return (reason.trim() === 'No data returned from the query.');
    }
}

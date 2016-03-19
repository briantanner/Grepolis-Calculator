'use strict';

const _ = require('underscore');
const BaseController = require('../base');

let models = require('../../models'),
    logger = require('../../lib/logger')({
      consoleLabel: 'web',
      tags: ['web']
    });

class Monitor extends BaseController {

  constructor() {
    super();

    return {
      playerUpdates: {
        method: 'get',
        name: 'api.monitor.updates',
        uri: '/api/v1/:server/monitor/updates',
        handler: this.playerUpdates.bind(this)
      },
      conquers: {
        method: 'get',
        name: 'api.monitor.conquers',
        uri: '/api/v1/:server/monitor/conquers',
        handler: this.conquers.bind(this)
      },
      allianceChanges: {
        method: 'get',
        name: 'api.monitor.allianceChanges',
        uri: '/api/v1/:server/monitor/allianceChanges',
        handler: this.allianceChanges.bind(this)
      }
    };
  }

  playerUpdates(req, res) {
    let server = req.params.server,
        time = req.query.time || null,
        alliances = req.query.alliances || null,
        where = { server: server };

    if (!time) {
      return res.send(500, 'Time parameter required.');
    }

    where.time = { $gte: time };
    if (alliances) {
      alliances = _.map(alliances.split(','), id => { return parseInt(id, 10); });
      where.alliance = { $any: alliances };
    }

    models.PlayerUpdates.findAll({
      where: where,
      order: 'time DESC',
      limit: 3000
    })
    .then(updates => {
      updates = updates.map(o => { return o.toJSON(); });
      
      let data = {
        count: updates.length,
        updates: updates
      };

      return res.send(200, data);
    })
    .catch(err => {
      logger.error(err);
      return res.send(500, err);
    });
  }

  conquers(req, res) {
    let server = req.params.server,
        time = req.query.time || null,
        alliances = req.query.alliances || null,
        where = { server: server };

    if (!time) {
      return res.send(500, 'Time parameter required.');
    }

    where.time = { $gte: time };
    if (alliances) {
      alliances = _.map(alliances.split(','), id => { return parseInt(id, 10); });
      where = _.extend(where, {
        $or: [
          { newally: { $in: alliances } },
          { oldally: { $in: alliances } }
        ]
      });
    }

    models.Conquers.getConquers({ where })
    .then(conquers => {
      let data = {
        count: conquers.length,
        updates: conquers
      };

      return res.send(200, data);
    })
    .catch(err => {
      logger.error(err);
      return res.send(500, err);
    });
  }

  allianceChanges(req, res) {
    let server = req.params.server,
        time = req.query.time || null,
        alliances = req.query.alliances || null,
        where = { server: server };

    if (!time) {
      return res.send(500, 'Time parameter required.');
    }

    where.time = { $gte: time };
    if (alliances) {
      alliances = _.map(alliances.split(','), id => { return parseInt(id, 10); });
      where = _.extend(where, {
        $or: [
          { new_alliance: { $in: alliances } },
          { old_alliance: { $in: alliances } }
        ]
      });
    }

    models.AllianceMemberChanges.findAll({
      where: where
    })
    .then(changes => {
      let data = {
        count: changes.length,
        updates: changes
      };

      return res.send(200, data);
    })
    .catch(err => {
      logger.error(err);
      return res.send(500, err);
    });
  }
}

module.exports = new Monitor();

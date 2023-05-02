export default {
  subscribe: {
    args: [
      {
        value: 'scheduled'
      },
      {
        value: 'conditional'
      }
    ],
    options: {
      scheduled: [
        {
          name: 'interval',
          type: 'number'
        }
      ],
      conditional: [
        {
          name: 'min_pm_2_5',
          type: 'number',
          optional: true
        },
        {
          name: 'max_pm_2_5',
          type: 'number',
          optional: true
        },
        {
          name: 'min_pm_10',
          type: 'number',
          optional: true
        },
        {
          name: 'max_pm_10',
          type: 'number',
          optional: true
        }
      ],
      shared: [
        {
          name: 'cities',
          type: 'array'
        }
      ]
    }
  },
  unsubscribe: {
    args: '*'
  }
};

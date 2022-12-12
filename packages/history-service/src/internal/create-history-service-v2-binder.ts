import {FeatureServiceBinder, FeatureServiceBinding} from '@feature-hub/core';
import {HistoryServiceV2} from '..';
import {BrowserConsumerHistory} from './browser-consumer-history';
import {ConsumerHistory} from './consumer-history';
import {HistoryMultiplexers} from './create-history-multiplexers';
import {createHistoryV4Adapter} from './create-history-v4-adapter';
import {HistoryMultiplexer} from './history-multiplexer';
import {HistoryServiceContext} from './history-service-context';
import {StaticConsumerHistory} from './static-consumer-history';

function createHistoryServiceV2(
  context: HistoryServiceContext,
  historyKey: string,
  consumerHistory: ConsumerHistory,
  historyMultiplexer: HistoryMultiplexer
): HistoryServiceV2 {
  return {
    historyKey,
    history: createHistoryV4Adapter(context, consumerHistory),
    rootHistory: historyMultiplexer.rootHistoryV2,

    createNewRootLocationForMultipleConsumers: (...consumerLocations) =>
      historyMultiplexer.createNewRootLocationForMultipleConsumers(
        ...consumerLocations.map(
          ({
            historyKey: otherHistoryKey,
            location: {pathname, search, hash, state},
          }) => ({
            historyKey: otherHistoryKey,
            location: {pathname, search, hash},
            state,
          })
        )
      ),
  };
}

function createBrowserHistoryServiceV2Binding(
  context: HistoryServiceContext,
  historyMultiplexers: HistoryMultiplexers,
  consumerId: string
): FeatureServiceBinding<HistoryServiceV2> {
  const consumerHistory = new BrowserConsumerHistory(
    context,
    consumerId,
    historyMultiplexers.browserHistoryMultiplexer
  );

  return {
    featureService: createHistoryServiceV2(
      context,
      consumerId,
      consumerHistory,
      historyMultiplexers.browserHistoryMultiplexer
    ),

    unbind: () => {
      consumerHistory.destroy();
    },
  };
}

function createStaticHistoryServiceV2Binding(
  context: HistoryServiceContext,
  historyMultiplexers: HistoryMultiplexers,
  consumerId: string
): FeatureServiceBinding<HistoryServiceV2> {
  const consumerHistory = new StaticConsumerHistory(
    context,
    consumerId,
    historyMultiplexers.staticHistoryMultiplexer
  );

  return {
    featureService: createHistoryServiceV2(
      context,
      consumerId,
      consumerHistory,
      historyMultiplexers.staticHistoryMultiplexer
    ),
  };
}

export function createHistoryServiceV2Binder(
  context: HistoryServiceContext,
  historyMultiplexers: HistoryMultiplexers,
  mode: 'browser' | 'static'
): FeatureServiceBinder<HistoryServiceV2> {
  return (consumerId: string): FeatureServiceBinding<HistoryServiceV2> =>
    mode === 'browser'
      ? createBrowserHistoryServiceV2Binding(
          context,
          historyMultiplexers,
          consumerId
        )
      : createStaticHistoryServiceV2Binding(
          context,
          historyMultiplexers,
          consumerId
        );
}

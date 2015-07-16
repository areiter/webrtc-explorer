var SimplePeer = require('simple-peer');
var wrtc = require('wrtc')

exports = module.exports = ChannelManager;

function ChannelManager(peerId, ioc, router) {
    var self = this;

    /// establish a connection to another peer

    self.connect = function(dstId, cb) {
        console.log('connect to: ', dstId);

        var intentId = (~~(Math.random() * 1e9))
                        .toString(36) + Date.now();

        var channel = new SimplePeer({initiator: true, wrtc: wrtc});

        channel.on('signal', function (signal) {
            console.log('sendOffer');
            ioc.emit('s-send-offer', {offer: {
                intentId: intentId,
                srcId: peerId.toHex(),
                dstId: dstId,
                signal: signal
            }});
        });

        var listener = ioc.on('c-offer-accepted', offerAccepted);

        function offerAccepted(data) {
            if(data.offer.intentId !== intentId) { 
//                log('OK: not right intentId: ',
//                        data.offer.intentId, intentId);
                return; 
            }
            console.log('offerAccepted');

            channel.signal(data.offer.signal);

            channel.on('ready', function() {
                console.log('channel ready to send');
                channel.on('message', function(){
                    console.log('DEBUG: this channel should be '+
                        'only used to send and not to receive');
                });
                cb(null, channel);
            });
        }
    };

    /// accept offers from peers that want to connect

    ioc.on('c-accept-offer', function(data) {
        console.log('acceptOffer');
        var channel = new SimplePeer({wrtc: wrtc});

        channel.on('ready', function() { 
            console.log('channel ready to listen');
            channel.on('message', router);
        });

        channel.on('signal', function (signal){
            // log('sending back my signal data');
            data.offer.signal = signal;
            ioc.emit('s-offer-accepted', data);
        });

        channel.signal(data.offer.signal);
    });

}

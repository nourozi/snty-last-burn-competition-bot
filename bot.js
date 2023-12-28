import Web3 from 'web3';
import { formatUnits } from 'viem'
import * as web3Validator from 'web3-validator';
import validator from 'validator';
import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'

dotenv.config()

const token = process.env.TELEGRAM_BOT_TOKEN
const bot_manager = process.env.BOT_MANAGER
const bot_manager_dev = bot_manager

const bot = new TelegramBot(token, { polling: true })

const sessions = new Map();

const sendMessageOption = { disable_web_page_preview: true, parse_mode: 'HTML' };

const setDefaultSettings = (session) => {
    session.admin = false

    if (session.chatid.toString() === bot_manager.toString()) {
        session.admin = true
    }

    if (session.chatid.toString() === bot_manager_dev.toString()) {
        session.admin = true
    }
}

const getSessionId = (message) => {
    return `${message.from.id}-${message.chat.id}`
}

const getSession = (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) {
        throw "NO SESSION on getSession"
    }
    return session;
}

const isExistSession = (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) {
        return false
    }
    return true;
}

const initSession = (message) => {
    const sessionId = getSessionId(message);
    if (!isExistSession(sessionId)) {
        const fromid = message?.from?.id;
        const chatid = message?.chat?.id;
        const username = message?.chat?.username;
        const type = message?.chat?.type;

        const session = {
            fromid: fromid ? fromid : undefined,
            chatid: chatid ? chatid : undefined,
            username: username ? username : undefined,
            type: type ? type : 'private',
        }

        setDefaultSettings(session)

        sessions.set(`${session.fromid}-${session.chatid}`, session)

        return session;
    }

    return getSession(sessionId)
}

const BOT_COMMAND_HELP = '/help' // help
const BOT_COMMAND_START = '/start' // start bot
const BOT_COMMAND_START_COMPETITION = '/startcompetition' // start competition
const BOT_COMMAND_END_COMPETITION = '/endcompetition' // end competition
const BOT_COMMAND_SET_MINIMUM_BURN_AMOUNT = '/set_minimum_burn_amount'; // set minimum burn amount
const BOT_COMMAND_SET_INCREASE_BURN_AMOUNT = '/set_increase_burn_amount'; // set increase burn amount
const BOT_COMMAND_SET_COUNTDOWN_PERIOD = '/set_countdown_timer'; // set countdown timer
const BOT_COMMAND_SET_PRIZE_AMOUNT = '/set_prize_amount'; // set prize amount
const BOT_COMMAND_SET_BURN_ADDRESS = '/set_burn_address'; // set burn address
const BOT_COMMAND_SET_TOKEN_ADDRESS = '/set_token_address'; // set token address
const BOT_COMMAND_SET_BUY_TOKEN_LINK = '/set_buy_token_link'; // set buy token link
const BOT_COMMAND_SET_TOKEN_BURN_CHANNEL = '/set_burn_channel_link'; // set burn channel link
const BOT_COMMAND_SET_VIDEO = '/set_video'; // set video
const BOT_COMMAND_SET_CHANNEL = '/set_channel_1' // set channel 1 id
const BOT_COMMAND_SET_CHANNEL_2 = '/set_channel_2' // set channel 2 id
const BOT_COMMAND_SHOW_INFO = '/show_info' // show info
const BOT_COMMAND_GET_CHAT_ID = '/get_chat_id' // get chat id

const SETTING_STATE_IDLE = 100;
const SETTING_STATE_WAIT_MINIMUM_BURN_AMOUNT = 101;
const SETTING_STATE_WAIT_INCREASE_BURN_AMOUNT = 102;
const SETTING_STATE_WAIT_COUNTDOWN_PERIOD = 103;
const SETTING_STATE_WAIT_PRIZE_AMOUNT = 104;
const SETTING_STATE_WAIT_BURN_ADDRESS = 105;
const SETTING_STATE_WAIT_TOKEN_ADDRESS = 106;
const SETTING_STATE_WAIT_BUY_TOKEN_LINK = 107;
const SETTING_STATE_WAIT_TOKEN_BURN_CHANNEL = 108;
const SETTING_STATE_WAIT_VIDEO = 109;
const SETTING_STATE_WAIT_CHANNEL = 110;
const SETTING_STATE_WAIT_CHANNEL_2 = 113;

const RUNNING_STATE_RUN = 201;
const RUNNING_STATE_STOP = 202;

const FILE_TYPE_PHOTO = 301;
const FILE_TYPE_MP4 = 302;
const FILE_TYPE_GIF = 303;

const VALID_COMPETITION = 400
const ERROR_MINIMUM_BURN_AMOUNT = 401
const ERROR_INCREASE_BURN_AMOUNT = 402
const ERROR_COUNTDOWN_PERIOD = 403
const ERROR_PRIZE_AMOUNT = 404
const ERROR_BURN_ADDRESS = 405
const ERROR_TOKEN_ADDRESS = 406
const ERROR_BUY_TOKEN_LINK = 407
const ERROR_TOKEN_BURN_CHANNEL = 408
const ERROR_VIDEO_FILE = 409
const ERROR_CHAIN_ID = 410
const ERROR_VALID_TOKEN = 411
const ERROR_CHANNEL_ID = 413
const ERROR_CHANNEL_ID_2 = 414

const MESSAGE_TYPE_START_COMPETITION = 501
const MESSAGE_TYPE_MIN_BURN_INCREASE = 502
const MESSAGE_TYPE_NEW_BURNER = 503
const MESSAGE_TYPE_WINNER = 504

const CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
];

const CHAIN_BSC = {
    chainID: 56,
    chainName: 'BSC',
    chainRPC: 'https://bsc-pokt.nodies.app',
    chainScan: 'https://bscscan.com'
}

const global = {
    minimumBurnAmount: 0,
    increaseBurnAmount: 0,
    countdownPeriod: 0,
    prizeAmount: 0,
    burnAddress: '',
    tokenAddress: '',
    buyTokenLink: "",
    tokenBurnChannel: '',
    videoFile: '',
    videoType: FILE_TYPE_MP4,
    symbol: '$TOKEN',
    decimals: 0,
    channel_id: 0,
    channel_id_2: 0,
    setting_state: SETTING_STATE_IDLE,
    running_state: RUNNING_STATE_STOP
}

const getWelcomeMessage = () => {
    let message = `<b>Welcome to LastBurnCompetitionBot! \n\nHow it works: \n\n</b>`
    message += `/help - help\n`
    message += `/startcompetition - start competition\n`
    message += `/endcompetition - end competition\n`
    message += `/set_minimum_burn_amount - set minimum burn amount\n`
    message += `/set_increase_burn_amount - set increase burn amount\n`
    message += `/set_countdown_timer - set countdown timer\n`
    message += `/set_prize_amount - set prize amount\n`
    message += `/set_burn_address - set burn address\n`
    message += `/set_token_address - set token address\n`
    message += `/set_buy_token_link - set buy token link\n`
    message += `/set_burn_channel_link - set burn channel link\n`
    message += `/set_video - set video\n`
    message += `/set_channel_1 - set channel 1 id\n`
    message += `/set_channel_2 - set channel 2 id\n`
    message += `/show_info - show info\n`
    message += `/get_chat_id - get chat id\n\n`
    message += `<a href="https://t.me/CryptoSnowPrince"><b>Metabestech</b></a>`
    return message;
}

const getUnknownMessage = () => {
    return `Unknown Command!`;
}

const getNonAdminMessage = (session) => {
    const msg = `You have not admin role.\n`
    return msg;
}

bot.on('message', async (message) => {
    try {
        const session = initSession(message)

        if (global.setting_state === SETTING_STATE_IDLE) {
            if (!message.entities) {
                await bot.sendMessage(session.chatid, getUnknownMessage(), sendMessageOption)
                return;
            }

            const commandEntity = message.entities.find(entity => entity.type === 'bot_command');
            if (!commandEntity) {
                await bot.sendMessage(session.chatid, getUnknownMessage(), sendMessageOption)
                return;
            }

            const command = message.text.substring(commandEntity.offset, commandEntity.offset + commandEntity.length);

            if (command === BOT_COMMAND_HELP) {
                await bot.sendMessage(session.chatid, getWelcomeMessage(), sendMessageOption);
                return
            } else if (command === BOT_COMMAND_START) {
                await bot.sendMessage(session.chatid, getWelcomeMessage(), sendMessageOption);
                return
            } else if (command === BOT_COMMAND_GET_CHAT_ID) {
                await bot.sendMessage(session.chatid, 'Chat ID has been sent to admin.', sendMessageOption);
                await bot.sendMessage(Number(bot_manager), `<code>${JSON.stringify(message.chat, null, 2)}</code>\n\nChatId: <code>${session.chatid}</code>\n`, sendMessageOption);
                await bot.sendMessage(Number(bot_manager_dev), `<code>${JSON.stringify(message.chat, null, 2)}</code>\n\nChatId: <code>${session.chatid}</code>\n`, sendMessageOption);
                return
            } else if (!session.admin) {
                await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
                return;
            } else if (command === BOT_COMMAND_SHOW_INFO) {
                await bot.sendMessage(session.chatid, getBotInfo(), sendMessageOption);
                return
            } else if (command === BOT_COMMAND_START_COMPETITION) {
                const startMsg = await startCompetition()
                await bot.sendMessage(session.chatid, startMsg, sendMessageOption)
                return;
            } else if (command === BOT_COMMAND_END_COMPETITION) {
                const stopMsg = await stopCompetition()
                await bot.sendMessage(session.chatid, stopMsg, sendMessageOption)
                return
            } else if (command === BOT_COMMAND_SET_MINIMUM_BURN_AMOUNT) {
                global.setting_state = SETTING_STATE_WAIT_MINIMUM_BURN_AMOUNT;
                await bot.sendMessage(session.chatid, 'Please enter then minimum burn amount!', sendMessageOption)
                return
            } else if (command === BOT_COMMAND_SET_INCREASE_BURN_AMOUNT) {
                global.setting_state = SETTING_STATE_WAIT_INCREASE_BURN_AMOUNT;
                await bot.sendMessage(session.chatid, 'Please enter the increase burn amount!', sendMessageOption)
                return
            } else if (command === BOT_COMMAND_SET_COUNTDOWN_PERIOD) {
                global.setting_state = SETTING_STATE_WAIT_COUNTDOWN_PERIOD;
                await bot.sendMessage(session.chatid, 'Please enter countdown timer in hour!', sendMessageOption)
                return
            } else if (command === BOT_COMMAND_SET_PRIZE_AMOUNT) {
                global.setting_state = SETTING_STATE_WAIT_PRIZE_AMOUNT;
                await bot.sendMessage(session.chatid, 'Please enter prize amount', sendMessageOption)
                return
            } else if (command === BOT_COMMAND_SET_BURN_ADDRESS) {
                global.setting_state = SETTING_STATE_WAIT_BURN_ADDRESS;
                await bot.sendMessage(session.chatid, 'Please enter burn address', sendMessageOption)
                return
            } else if (command === BOT_COMMAND_SET_TOKEN_ADDRESS) {
                global.setting_state = SETTING_STATE_WAIT_TOKEN_ADDRESS;
                await bot.sendMessage(session.chatid, 'Please enter token address', sendMessageOption)
                return
            } else if (command === BOT_COMMAND_SET_BUY_TOKEN_LINK) {
                global.setting_state = SETTING_STATE_WAIT_BUY_TOKEN_LINK;
                await bot.sendMessage(session.chatid, 'Please enter buy token link', sendMessageOption)
                return
            } else if (command === BOT_COMMAND_SET_TOKEN_BURN_CHANNEL) {
                global.setting_state = SETTING_STATE_WAIT_TOKEN_BURN_CHANNEL;
                await bot.sendMessage(session.chatid, 'Please enter token burn channel', sendMessageOption)
                return
            } else if (command === BOT_COMMAND_SET_VIDEO) {
                global.setting_state = SETTING_STATE_WAIT_VIDEO;
                await bot.sendMessage(session.chatid, 'Please put video! For now, MP4, JPG, PNG, GIF is possible to upload!', sendMessageOption)
                return
            } else if (command === BOT_COMMAND_SET_CHANNEL) {
                global.setting_state = SETTING_STATE_WAIT_CHANNEL;
                await bot.sendMessage(session.chatid, 'Please enter channel 1', sendMessageOption)
                return
            } else if (command === BOT_COMMAND_SET_CHANNEL_2) {
                global.setting_state = SETTING_STATE_WAIT_CHANNEL_2;
                await bot.sendMessage(session.chatid, 'Please enter channel 2', sendMessageOption)
                return
            } else {
                await bot.sendMessage(session.chatid, getUnknownMessage(), sendMessageOption)
                return;
            }
        } else if (global.setting_state === SETTING_STATE_WAIT_MINIMUM_BURN_AMOUNT) {
            global.setting_state = SETTING_STATE_IDLE
            if (!session.admin) {
                await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
            } else if (message.text && parseInt(message.text)) {
                global.minimumBurnAmount = parseInt(message.text)
                await bot.sendMessage(session.chatid, `✅ Successfully updated the minimum burn amount!`, sendMessageOption)
            } else {
                await bot.sendMessage(session.chatid, `😢 Sorry, Invalid Value, Please enter the valid value.`, sendMessageOption)
            }
        } else if (global.setting_state === SETTING_STATE_WAIT_INCREASE_BURN_AMOUNT) {
            global.setting_state = SETTING_STATE_IDLE
            if (!session.admin) {
                await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
            } else if (message.text && parseInt(message.text)) {
                global.increaseBurnAmount = parseInt(message.text)
                await bot.sendMessage(session.chatid, `✅ Successfully updated the increase burn amount!`, sendMessageOption)
            } else {
                await bot.sendMessage(session.chatid, `😢 Sorry, Invalid Value, Please enter the valid value.`, sendMessageOption)
            }
        } else if (global.setting_state === SETTING_STATE_WAIT_COUNTDOWN_PERIOD) {
            global.setting_state = SETTING_STATE_IDLE
            if (!session.admin) {
                await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
            } else if (message.text && parseInt(message.text)) {
                global.countdownPeriod = parseInt(message.text)
                await bot.sendMessage(session.chatid, `✅ Successfully updated the countdown period!`, sendMessageOption)
            } else {
                await bot.sendMessage(session.chatid, `😢 Sorry, Invalid Value, Please enter the valid value.`, sendMessageOption)
            }
        } else if (global.setting_state === SETTING_STATE_WAIT_PRIZE_AMOUNT) {
            global.setting_state = SETTING_STATE_IDLE
            if (!session.admin) {
                await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
            } else if (message.text && parseInt(message.text)) {
                global.prizeAmount = parseInt(message.text)
                await bot.sendMessage(session.chatid, `✅ Successfully updated the prize amount!`, sendMessageOption)
            } else {
                await bot.sendMessage(session.chatid, `😢 Sorry, Invalid Value, Please enter the valid value.`, sendMessageOption)
            }
        } else if (global.setting_state === SETTING_STATE_WAIT_BURN_ADDRESS) {
            global.setting_state = SETTING_STATE_IDLE
            if (!session.admin) {
                await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
            } else if (message.text && web3Validator.isAddress(message.text)) {
                global.burnAddress = message.text
                await bot.sendMessage(session.chatid, `✅ Successfully updated the burn address!`, sendMessageOption)
            } else {
                await bot.sendMessage(session.chatid, `😢 Sorry, Invalid address, Please enter the valid address.`, sendMessageOption)
            }
        } else if (global.setting_state === SETTING_STATE_WAIT_TOKEN_ADDRESS) {
            global.setting_state = SETTING_STATE_IDLE
            if (!session.admin) {
                await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
            } else if (message.text && web3Validator.isAddress(message.text)) {
                global.tokenAddress = message.text
                await bot.sendMessage(session.chatid, `✅ Successfully updated the token address!`, sendMessageOption)
            } else {
                await bot.sendMessage(session.chatid, `😢 Sorry, Invalid address, Please enter the valid address.`, sendMessageOption)
            }
        } else if (global.setting_state === SETTING_STATE_WAIT_BUY_TOKEN_LINK) {
            global.setting_state = SETTING_STATE_IDLE
            if (!session.admin) {
                await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
            } else if (message.text && isValidUrl(message.text)) {
                global.buyTokenLink = message.text
                await bot.sendMessage(session.chatid, `✅ Successfully updated the buy token link!`, sendMessageOption)
            } else {
                await bot.sendMessage(session.chatid, `😢 Sorry, Invalid link, Please enter the valid link.`, sendMessageOption)
            }
        } else if (global.setting_state === SETTING_STATE_WAIT_TOKEN_BURN_CHANNEL) {
            global.setting_state = SETTING_STATE_IDLE
            if (!session.admin) {
                await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
            } else if (message.text && isValidUrl(message.text)) {
                global.tokenBurnChannel = message.text
                await bot.sendMessage(session.chatid, `✅ Successfully updated the token burn channel!`, sendMessageOption)
            } else {
                await bot.sendMessage(session.chatid, `😢 Sorry, Invalid channel, Please enter the valid channel link.`, sendMessageOption)
            }
        } else if (global.setting_state === SETTING_STATE_WAIT_VIDEO) {
            let file_id = '';
            let file_type = '';
            if (!session.admin) {
                await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
            } else {
                if (message.photo && message.photo.length) {
                    const photo = message.photo[message.photo.length - 1];
                    file_id = photo.file_id
                    file_type = FILE_TYPE_PHOTO;
                } else if (message.video && message.video.mime_type === 'video/mp4') {
                    file_id = message.video.file_id
                    file_type = FILE_TYPE_MP4;
                } else if (message.document) {
                    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4'];
                    const fileName = message.document.file_name.toLowerCase();
                    const extension = fileName.split('.').pop();

                    if (allowedExtensions.includes(extension)) {
                        file_id = message.document.file_id
                        file_type = FILE_TYPE_GIF;
                    }
                }

                if (file_id) {
                    global.videoFile = file_id
                    global.videoType = file_type
                    await bot.sendMessage(session.chatid, `✅ Successfully updated the video!`, sendMessageOption)
                } else {
                    await bot.sendMessage(session.chatid, `😢 Sorry, Invalid video, Please upload the valid video.`, sendMessageOption)
                }
            }
            global.setting_state = SETTING_STATE_IDLE
        } else if (global.setting_state === SETTING_STATE_WAIT_CHANNEL) {
            if (!session.admin) {
                await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
            } else if (message.text && Number(message.text)) {
                global.channel_id = Number(message.text)
                await bot.sendMessage(session.chatid, `✅ Successfully updated the channel 1!`, sendMessageOption)
            } else {
                await bot.sendMessage(session.chatid, `😢 Sorry, Invalid channel, Please enter the valid channel id.`, sendMessageOption)
            }
            global.setting_state = SETTING_STATE_IDLE
        } else if (global.setting_state === SETTING_STATE_WAIT_CHANNEL_2) {
            if (!session.admin) {
                await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
            } else if (message.text && Number(message.text)) {
                global.channel_id_2 = Number(message.text)
                await bot.sendMessage(session.chatid, `✅ Successfully updated the channel 2!`, sendMessageOption)
            } else {
                await bot.sendMessage(session.chatid, `😢 Sorry, Invalid channel, Please enter the valid channel id.`, sendMessageOption)
            }
            global.setting_state = SETTING_STATE_IDLE
        } else if (!session.admin) {
            await bot.sendMessage(session.chatid, getNonAdminMessage(session), sendMessageOption)
            return;
        } else {
            await bot.sendMessage(session.chatid, `😢 Sorry, Something went wrong! Please try again later!\n Error 0`, sendMessageOption)
            return;
        }
    } catch (error) {
        console.log('message: ', error)
        try {
            await bot.sendMessage(message.chat.id, `😢 Sorry, Something went wrong! Please try again later!\n Error 1`, sendMessageOption)
        } catch (error) {
            console.log('message2: ', error)
        }
    }
})

const getCompetitionStatus = () => {
    if (global.running_state === RUNNING_STATE_RUN) {
        return RUNNING_STATE_RUN
    } else if (global.running_state === RUNNING_STATE_STOP) {
        return RUNNING_STATE_STOP
    }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

const isValidToken = async () => {
    try {
        const web3 = new Web3(CHAIN_BSC.chainRPC);
        const contract = new web3.eth.Contract(CONTRACT_ABI, global.tokenAddress);
        const symbol = await contract.methods.symbol().call();
        await sleep(1000);
        const decimals = await contract.methods.decimals().call();
        global.symbol = symbol;
        global.decimals = Number(decimals);
        return true
    } catch (error) {
        console.log('isValidToken error')
        try {
            bot.sendMessage(Number(bot_manager_dev), `😢 isValidToken error!`, sendMessageOption)
        } catch (error) {
            console.log('isValidToken error2')
        }
        return false
    }
}

function isValidUrl(url) {
    return validator.isURL(url, {
        protocols: ['http', 'https'],
        require_protocol: true
    });
}

const isValidCompetition = async () => {
    if (!Number(global.minimumBurnAmount)) {
        return ERROR_MINIMUM_BURN_AMOUNT;
    } else if (!Number(global.increaseBurnAmount)) {
        return ERROR_INCREASE_BURN_AMOUNT;
    } else if (!Number(global.countdownPeriod)) {
        return ERROR_COUNTDOWN_PERIOD
    } else if (!Number(global.prizeAmount)) {
        return ERROR_PRIZE_AMOUNT
    } else if (!web3Validator.isAddress(global.burnAddress)) {
        return ERROR_BURN_ADDRESS
    } else if (!web3Validator.isAddress(global.tokenAddress)) {
        return ERROR_TOKEN_ADDRESS
    } else if (!global.buyTokenLink || !isValidUrl(global.buyTokenLink)) {
        return ERROR_BUY_TOKEN_LINK
    } else if (!global.tokenBurnChannel || !isValidUrl(global.tokenBurnChannel)) {
        return ERROR_TOKEN_BURN_CHANNEL
    } else if (!global.videoFile) {
        return ERROR_VIDEO_FILE
    } else if (!global.channel_id) {
        return ERROR_CHANNEL_ID
    } else if (!global.channel_id_2) {
        return ERROR_CHANNEL_ID_2
    }

    const isValid = await isValidToken();
    if (!isValid) {
        return ERROR_VALID_TOKEN
    }

    return VALID_COMPETITION
}

const gCompInfo = {
    tokenAddress: global.tokenAddress,
    minBurn: global.minimumBurnAmount,
    curMinBurn: global.minimumBurnAmount,
    curCntDownPeriod: global.countdownPeriod * 3600,
    prizeAmount: global.prizeAmount,
    incBurn: global.increaseBurnAmount,

    burnAddress: global.burnAddress,
    buyTokenLink: global.buyTokenLink,
    tokenBurnChannel: global.tokenBurnChannel,
    videoFile: global.videoFile,
    videoType: global.videoType,
    symbol: global.symbol,
    decimals: global.decimals,
    channel_id: global.channel_id,
    channel_id_2: global.channel_id_2,

    curCntDown: 0,
    totalBurn: 0,
    winner: '0x0000000000000000000000000000000000000000',
    airdrop: [],
}

const errCodeToString = (errCode) => {
    switch (errCode) {
        case VALID_COMPETITION:
            return 'You can start to competition!'
        case ERROR_MINIMUM_BURN_AMOUNT:
            return '😢 Sorry, Bot config is not completed, Please set the minimum burn amount.'
        case ERROR_INCREASE_BURN_AMOUNT:
            return '😢 Sorry, Bot config is not completed, Please set the increase burn amount.'
        case ERROR_COUNTDOWN_PERIOD:
            return '😢 Sorry, Bot config is not completed, Please set the countdown timer.'
        case ERROR_PRIZE_AMOUNT:
            return '😢 Sorry, Bot config is not completed, Please set the prize amount.'
        case ERROR_BURN_ADDRESS:
            return '😢 Sorry, Bot config is not completed, Please set the burn address.'
        case ERROR_TOKEN_ADDRESS:
            return '😢 Sorry, Bot config is not completed, Please set the token address.'
        case ERROR_BUY_TOKEN_LINK:
            return '😢 Sorry, Bot config is not completed, Please set the link to buy token.'
        case ERROR_TOKEN_BURN_CHANNEL:
            return '😢 Sorry, Bot config is not completed, Please set the burn channel link.'
        case ERROR_VIDEO_FILE:
            return '😢 Sorry, Bot config is not completed, Please upload the video(mp4, gif, jpg).'
        case ERROR_CHAIN_ID:
            return '😢 Sorry, Bot config is not completed, Please set the chain.'
        case ERROR_VALID_TOKEN:
            return '😢 Sorry, Current token is invalid token, Please check the token address.'
        case ERROR_CHANNEL_ID:
            return '😢 Sorry, Bot config is not completed, Please set the channel 1 id.'
        case ERROR_CHANNEL_ID_2:
            return '😢 Sorry, Bot config is not completed, Please set the channel 2 id.'
        default:
            return ''
    }
}

const startCompetition = async () => {
    const competitionStatus = getCompetitionStatus();
    if (competitionStatus === RUNNING_STATE_RUN) {
        return "✅ Already started the competition!"
    } else {
        const validCode = await isValidCompetition();
        if (validCode === VALID_COMPETITION) {
            global.running_state = RUNNING_STATE_RUN

            gCompInfo.tokenAddress = global.tokenAddress;
            gCompInfo.minBurn = global.minimumBurnAmount;
            gCompInfo.curMinBurn = global.minimumBurnAmount;
            gCompInfo.curCntDownPeriod = global.countdownPeriod * 3600;
            gCompInfo.prizeAmount = global.prizeAmount;
            gCompInfo.incBurn = global.increaseBurnAmount;

            gCompInfo.burnAddress = global.burnAddress;
            gCompInfo.buyTokenLink = global.buyTokenLink;
            gCompInfo.tokenBurnChannel = global.tokenBurnChannel;
            gCompInfo.videoFile = global.videoFile;
            gCompInfo.videoType = global.videoType;
            gCompInfo.symbol = global.symbol;
            gCompInfo.decimals = global.decimals;
            gCompInfo.channel_id = global.channel_id;
            gCompInfo.channel_id_2 = global.channel_id_2;

            gCompInfo.curCntDown = Math.floor(Date.now() / 1000) + gCompInfo.curCntDownPeriod;
            gCompInfo.totalBurn = 0;
            gCompInfo.winner = '0x0000000000000000000000000000000000000000';
            gCompInfo.airdrop = []

            await competitionMessage(MESSAGE_TYPE_START_COMPETITION)
            startTimers()
            return "✅ Successfully started the competition!"
        } else {
            return errCodeToString(validCode)
        }
    }
}

const stopCompetition = async () => {
    const competitionStatus = getCompetitionStatus();
    if (competitionStatus === RUNNING_STATE_STOP) {
        return "✅ Already stopped the competition!"
    } else {
        global.running_state = RUNNING_STATE_STOP
        resetTimers()
        return "✅ Successfully stopped the competition!"
    }
}

const competitionMessage = async (msgType, newBurner = '') => {
    let msg;
    try {
        const total = gCompInfo.curCntDown - Math.floor(Date.now() / 1000);
        const hours = Math.round(total / (60 * 60));

        const period = gCompInfo.curCntDownPeriod;
        const pSeconds = Math.floor((period) % 60);
        const pMinutes = Math.floor((period / 60) % 60);
        const pHours = Math.floor((period / (60 * 60)) % 24);
        const pDays = Math.floor((period / (60 * 60 * 24)));

        const tokenLink = `<a href="${CHAIN_BSC.chainScan}/token/${gCompInfo.tokenAddress}">$${gCompInfo.symbol}</a>`

        if (msgType == MESSAGE_TYPE_START_COMPETITION) { // New Competition
            msg = `<b>📣 ${tokenLink} LAST BURN COMPETITION STARTED</b>\n\n`;

            msg += `<b>🔥 CURRENT MIN BURN:</b> ${gCompInfo.curMinBurn} ${tokenLink}\n`;
            msg += `<b>⏰ COUNTDOWN:</b> ${hours} hours remaining\n`;
            msg += `<b>🏆 PRIZE:</b> ${gCompInfo.prizeAmount} BUSD\n\n`;
            msg += `<b>🎁 AIRDROP:</b> Every participant will receive an airdrop of our next token launch\n\n`;
            msg += `🔼 Every hour, the minimum burn required increases by ${gCompInfo.incBurn} ${tokenLink}\n`;
            msg += `🔄 Every new burn resets the countdown to ${pDays > 0 ? pDays + ` days ` : ``}${pHours > 0 ? pHours + ` hours ` : ``}${pMinutes > 0 ? pMinutes + ` minutes ` : ``}${pSeconds > 0 ? pSeconds + ` seconds ` : ``}\n`;
            msg += `🔄 Every new burn resets the minimum burn to ${gCompInfo.minBurn} ${tokenLink}\n`;
        } else if (msgType == MESSAGE_TYPE_MIN_BURN_INCREASE) { // Minimum Burn Increased!
            msg = `<b>📣 MINIMUM BURN INCREASED!</b>\n\n`;

            msg += `<b>🔥 CURRENT MIN BURN:</b> ${gCompInfo.curMinBurn} ${tokenLink}\n`;
            msg += `<b>⏰ COUNTDOWN:</b> ${hours} hours remaining\n`;
            msg += `<b>🏆 PRIZE:</b> ${gCompInfo.prizeAmount} BUSD\n\n`;
            msg += `<b>🎁 AIRDROP:</b> Every participant will receive an airdrop of our next token launch\n\n`;
            msg += `🔼 Every hour, the minimum burn required increases by ${gCompInfo.incBurn} ${tokenLink}\n`;
            msg += `🔄 Every new burn resets the countdown to ${pDays > 0 ? pDays + ` days ` : ``}${pHours > 0 ? pHours + ` hours ` : ``}${pMinutes > 0 ? pMinutes + ` minutes ` : ``}${pSeconds > 0 ? pSeconds + ` seconds ` : ``}\n`;
            msg += `🔄 Every new burn resets the minimum burn to ${gCompInfo.minBurn} ${tokenLink}\n`;
        } else if (msgType == MESSAGE_TYPE_NEW_BURNER) { // New Burner
            msg = `<b>📣 WE HAVE A NEW BURNER!</b>\n\n`;

            msg += `🔄 The minimum burn and countdown have been reset!\n\n`;
            msg += `<b>🔥 NEW BURNER:</b> <a href="${CHAIN_BSC.chainScan}/address/${newBurner}">${newBurner.substring(0, 5)}...${newBurner.substring(36)}</a>\n`;
            msg += `<b>🔥 CURRENT MIN BURN:</b> ${gCompInfo.curMinBurn} ${tokenLink}\n`;
            msg += `<b>⏰ COUNTDOWN:</b> ${hours} hours remaining\n`;
            msg += `<b>🏆 PRIZE:</b> ${gCompInfo.prizeAmount} BUSD\n\n`;
            msg += `<b>🎁 AIRDROP:</b> Every participant will receive an airdrop of our next token launch\n\n`;
            msg += `🔼 Every hour, the minimum burn required increases by ${gCompInfo.incBurn} ${tokenLink}\n`;
            msg += `🔄 Every new burn resets the countdown to ${pDays > 0 ? pDays + ` days ` : ``}${pHours > 0 ? pHours + ` hours ` : ``}${pMinutes > 0 ? pMinutes + ` minutes ` : ``}${pSeconds > 0 ? pSeconds + ` seconds ` : ``}\n`;
            msg += `🔄 Every new burn resets the minimum burn to ${gCompInfo.minBurn} ${tokenLink}\n`;
        } else if (msgType === MESSAGE_TYPE_WINNER) { // Winner
            msg = `<b>🏁 WE HAVE A WINNER!</b>\n\n`;

            msg += `<b>🏆 WINNER:</b> <a href="${CHAIN_BSC.chainScan}/address/${gCompInfo.winner}">${gCompInfo.winner.substring(0, 5)}...${gCompInfo.winner.substring(36)}</a>\n`;
            msg += `<b>🤑 PRIZE:</b> ${gCompInfo.prizeAmount} BUSD\n`;
            msg += `<b>🔥 TOTAL ${tokenLink} BURNED:</b> ${gCompInfo.totalBurn}\n\n`;
            msg += `🎁 AIRDROP RECEIPIENTS: As a token of our appreciation every participant of this competition will receive an airdrop of the next token we launch.\n\n`;

            for (let i = 0; i < gCompInfo.airdrop.length; i++) {
                msg += `<a href="${CHAIN_BSC.chainScan}/address/${gCompInfo.airdrop[i]}">${gCompInfo.airdrop[i]}</a>\n`;
            }
        } else {
            return;
        }

        const keyboard = {
            inline_keyboard: [
                [
                    { text: 'BURN ADDRESS', url: `${CHAIN_BSC.chainScan}/address/${gCompInfo.burnAddress}` }
                ],
                [
                    { text: `BUY $${gCompInfo.symbol}`, url: gCompInfo.buyTokenLink }
                ],
                [
                    { text: `$${gCompInfo.symbol} BURN CHANNEL`, url: gCompInfo.tokenBurnChannel }
                ],
            ]
        };
        if (gCompInfo.videoType === FILE_TYPE_PHOTO) {
            await bot.sendPhoto(gCompInfo.channel_id, gCompInfo.videoFile, {
                caption: msg,
                reply_markup: keyboard,
                disable_web_page_preview: true,
                parse_mode: 'HTML'
            })
            await bot.sendPhoto(gCompInfo.channel_id_2, gCompInfo.videoFile, {
                caption: msg,
                reply_markup: keyboard,
                disable_web_page_preview: true,
                parse_mode: 'HTML'
            })
        } else {
            await bot.sendVideo(gCompInfo.channel_id, gCompInfo.videoFile, {
                caption: msg,
                reply_markup: keyboard,
                disable_web_page_preview: true,
                parse_mode: 'HTML'
            })
            await bot.sendVideo(gCompInfo.channel_id_2, gCompInfo.videoFile, {
                caption: msg,
                reply_markup: keyboard,
                disable_web_page_preview: true,
                parse_mode: 'HTML'
            })
        }
    } catch (error) {
        console.log('competitionMessage: error', error)
        try {
            await bot.sendMessage(Number(bot_manager_dev), `😢 Sorry, Something went wrong! Please try again later!\n Error 2`, sendMessageOption)
        } catch (error) {
            console.log('message3: ', error)
        }
    }
}

let burnMonitorId = null;
let burnIncMonitorId = null;
let latestBN;
let startBN;

async function initBurnMonitor() {
    try {
        const web3 = new Web3(CHAIN_BSC.chainRPC);
        startBN = Number(await web3.eth.getBlockNumber())
    } catch (error) {
        console.log('initCompetition error')
        try {
            await bot.sendMessage(Number(bot_manager_dev), `😢 Sorry, Something went wrong! Please try again later!\n Error 3`, sendMessageOption)
        } catch (error) {
            console.log('message4: ', error)
        }
    }
}

async function burnMonitor() {
    if (global.running_state !== RUNNING_STATE_RUN) {
        return
    }
    try {
        const web3 = new Web3(CHAIN_BSC.chainRPC);
        latestBN = Number(await web3.eth.getBlockNumber())
        const contract = new web3.eth.Contract(CONTRACT_ABI, gCompInfo.tokenAddress);
        if (latestBN >= startBN) {
            try {
                // console.log('fromBlock: ', startBN)
                // console.log('toBlock: ', latestBN)
                const eventLists = await contract.getPastEvents("Transfer", { fromBlock: startBN, toBlock: latestBN });
                if (eventLists.length > 0) {
                    for (let idx = 0; idx < eventLists.length; idx++) {
                        const item = eventLists[idx].returnValues
                        if (item.to.toLowerCase() === gCompInfo.burnAddress.toLowerCase()) {
                            const burnAmount = Number(formatUnits(item.value, gCompInfo.decimals))
                            // console.log('burnAmount: ', burnAmount)
                            gCompInfo.totalBurn += burnAmount;
                            if (burnAmount >= gCompInfo.curMinBurn) {
                                gCompInfo.curMinBurn = gCompInfo.minBurn
                                gCompInfo.curCntDown = Math.floor(Date.now() / 1000) + gCompInfo.curCntDownPeriod;
                                // Burn Amount Increase Monitor
                                if (burnIncMonitorId) {
                                    clearInterval(burnIncMonitorId);
                                }

                                burnIncMonitorId = setInterval(async () => {
                                    burnIncreaseMonitor()
                                }, 3600 * 1000);
                                await competitionMessage(MESSAGE_TYPE_NEW_BURNER, item.from)
                                if (gCompInfo.airdrop.includes(item.from)) {
                                    const fAirdrop = gCompInfo.airdrop.filter(element => element !== item.from);
                                    gCompInfo.airdrop = fAirdrop
                                }
                                gCompInfo.airdrop.push(item.from)
                                gCompInfo.winner = item.from
                            }
                        }
                    }
                }
                startBN = latestBN + 1
            } catch (error) {
                console.log(error)
            }
        }
    } catch (error) {
        console.log('monitorBurn error')
        try {
            await bot.sendMessage(Number(bot_manager_dev), `😢 Sorry, Something went wrong! Please try again later!\n Error 4`, sendMessageOption)
        } catch (error) {
            console.log('message5: ', error)
        }
    }
}

function burnIncreaseMonitor() {
    if (global.running_state !== RUNNING_STATE_RUN) {
        return
    }
    try {
        if (Math.floor(Date.now() / 1000) < gCompInfo.curCntDown) {
            // burn amount increases
            gCompInfo.curMinBurn += gCompInfo.incBurn
            competitionMessage(MESSAGE_TYPE_MIN_BURN_INCREASE)
        } else {
            competitionMessage(MESSAGE_TYPE_WINNER)
            stopCompetition()
        }
    } catch (error) {
        console.log('monitorBurn error')
        try {
            bot.sendMessage(Number(bot_manager_dev), `😢 Sorry, Something went wrong! Please try again later!\n Error 5`, sendMessageOption)
        } catch (error) {
            console.log('message5: ', error)
        }
    }
}

async function startTimers() {
    // Burn Monitor
    if (burnMonitorId) {
        clearInterval(burnMonitorId);
    }

    await initBurnMonitor()
    await burnMonitor()

    burnMonitorId = setInterval(async () => {
        await burnMonitor()
    }, 12000);

    // Burn Amount Increase Monitor
    if (burnIncMonitorId) {
        clearInterval(burnIncMonitorId);
    }

    burnIncMonitorId = setInterval(async () => {
        burnIncreaseMonitor()
    }, 3600 * 1000);
}

function resetTimers() {
    if (burnMonitorId) {
        clearInterval(burnMonitorId);
        burnMonitorId = null;
    }

    if (burnIncMonitorId) {
        clearInterval(burnIncMonitorId);
        burnIncMonitorId = null;
    }
}

const getBotInfo = () => {
    let message = `<b>Welcome to LastBurnCompetitionBot! \n\nBot Global Info: \n\n</b>`
    const botInfo = {
        minimumBurnAmount: global.minimumBurnAmount ? global.minimumBurnAmount : 'not set',
        increaseBurnAmount: global.increaseBurnAmount ? global.increaseBurnAmount : 'not set',
        countdownPeriod: global.countdownPeriod ? global.countdownPeriod : 'not set',
        prizeAmount: global.prizeAmount ? global.prizeAmount : 'not set',
        burnAddress: global.burnAddress ? global.burnAddress : 'not set',
        tokenAddress: global.tokenAddress ? global.tokenAddress : 'not set',
        buyTokenLink: global.buyTokenLink ? global.buyTokenLink : 'not set',
        tokenBurnChannel: global.tokenBurnChannel ? global.tokenBurnChannel : 'not set',
        videoFile: global.videoFile ? global.videoFile : 'not set',
        channel_id: global.channel_id ? global.channel_id : 'not set',
        channel_id_2: global.channel_id_2 ? global.channel_id_2 : 'not set',
    }
    message += `<code>${JSON.stringify(botInfo, null, 2)}</code>\n\n`
    message += `\n<a href="https://t.me/CryptoSnowPrince"><b>Metabestech</b></a>`
    return message;
}

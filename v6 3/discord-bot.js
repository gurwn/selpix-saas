const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

// Discord Bot Configuration
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// API Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.selpix.com/v1';
const CHANNEL_CONFIG = {
    rocket: process.env.DISCORD_ROCKET_CHANNEL_ID,
    consignment: process.env.DISCORD_CONSIGNMENT_CHANNEL_ID,
    wing: process.env.DISCORD_WING_CHANNEL_ID,
    general: process.env.DISCORD_GENERAL_CHANNEL_ID
};

// Commands Data
const commands = [
    new SlashCommandBuilder()
        .setName('소싱요청')
        .setDescription('새로운 상품 소싱을 요청합니다')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('도매꾹 상품 URL')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('플랫폼')
                .setDescription('등록할 플랫폼을 선택하세요')
                .setRequired(true)
                .addChoices(
                    { name: '쿠팡 로켓', value: 'rocket' },
                    { name: '쿠팡 위탁', value: 'consignment' },
                    { name: '쿠팡 윙', value: 'wing' }
                ))
        .addNumberOption(option =>
            option.setName('목표마진율')
                .setDescription('목표 마진율 (기본값: 30%)')
                .setMinValue(10)
                .setMaxValue(100)),

    new SlashCommandBuilder()
        .setName('소싱조회')
        .setDescription('소싱 요청 상태를 조회합니다')
        .addStringOption(option =>
            option.setName('요청id')
                .setDescription('소싱 요청 ID')
                .setRequired(false)),

    new SlashCommandBuilder()
        .setName('소싱취소')
        .setDescription('소싱 요청을 취소합니다')
        .addStringOption(option =>
            option.setName('요청id')
                .setDescription('취소할 소싱 요청 ID')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('소싱템플릿')
        .setDescription('소싱 요청 템플릿을 표시합니다'),

    new SlashCommandBuilder()
        .setName('도움말')
        .setDescription('Selpix 봇 사용법을 표시합니다')
];

// Bot Events
client.once('ready', async () => {
    console.log(`Selpix Discord Bot logged in as ${client.user.tag}`);
    
    // Register slash commands
    try {
        console.log('Registering slash commands...');
        await client.application.commands.set(commands);
        console.log('Slash commands registered successfully');
    } catch (error) {
        console.error('Failed to register slash commands:', error);
    }
    
    // Set bot status
    client.user.setActivity('상품 소싱 자동화', { type: 'WATCHING' });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        switch (commandName) {
            case '소싱요청':
                await handleSourcingRequest(interaction);
                break;
            case '소싱조회':
                await handleSourcingInquiry(interaction);
                break;
            case '소싱취소':
                await handleSourcingCancel(interaction);
                break;
            case '소싱템플릿':
                await handleSourcingTemplate(interaction);
                break;
            case '도움말':
                await handleHelp(interaction);
                break;
            default:
                await interaction.reply('알 수 없는 명령어입니다.');
        }
    } catch (error) {
        console.error('Command execution error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ 오류 발생')
            .setDescription('명령어 처리 중 오류가 발생했습니다.')
            .addFields({ name: '오류 메시지', value: error.message || '알 수 없는 오류' })
            .setTimestamp();

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
});

// Command Handlers
async function handleSourcingRequest(interaction) {
    await interaction.deferReply();

    const url = interaction.options.getString('url');
    const platform = interaction.options.getString('플랫폼');
    const targetMargin = interaction.options.getNumber('목표마진율') || 30;
    const userId = interaction.user.id;
    const userName = interaction.user.username;

    // Validate URL
    if (!isValidUrl(url)) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ 잘못된 URL')
            .setDescription('올바른 도매꾹 URL을 입력해주세요.')
            .setTimestamp();

        return await interaction.editReply({ embeds: [errorEmbed] });
    }

    try {
        // Start product analysis
        const analysisResponse = await axios.post(`${API_BASE_URL}/products/analyze`, {
            productUrl: url,
            exchangeRate: 1350,
            shippingCost: 3000,
            storageFee: 0
        });

        const productInfo = analysisResponse.data.productInfo;

        // Calculate margin
        const marginResponse = await axios.post(`${API_BASE_URL}/margin/calculate`, {
            productId: productInfo.productId,
            wholesalePrice: productInfo.wholesalePrice,
            targetMarginRate: targetMargin,
            exchangeRate: 1350,
            shippingCost: 3000,
            commissionRate: 8.5
        });

        const marginReport = marginResponse.data;

        // Generate keywords
        const keywordResponse = await axios.post(`${API_BASE_URL}/keywords/generate`, {
            productInfo: {
                name: productInfo.name,
                category: productInfo.category,
                description: productInfo.description
            },
            count: 20
        });

        const keywords = keywordResponse.data.keywords;

        // Create success embed
        const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ 소싱 분석 완료')
            .setDescription(`**${productInfo.name}**`)
            .addFields(
                { name: '📦 상품 정보', value: `카테고리: ${productInfo.category}\n도매가: ₩${productInfo.wholesalePrice.toLocaleString()}`, inline: true },
                { name: '💰 마진 분석', value: `추천 판매가: ₩${marginReport.recommendedPrice.toLocaleString()}\n예상 마진: ₩${marginReport.marginAmount.toLocaleString()}\n마진율: ${marginReport.marginRate}%`, inline: true },
                { name: '🏷️ 추천 키워드', value: keywords.slice(0, 5).join(', ') + '...', inline: false },
                { name: '🎯 플랫폼', value: getPlatformName(platform), inline: true },
                { name: '👤 요청자', value: userName, inline: true }
            )
            .setThumbnail(productInfo.image)
            .setFooter({ text: `요청 ID: ${productInfo.productId}` })
            .setTimestamp();

        // Send to appropriate channel
        const targetChannelId = CHANNEL_CONFIG[platform] || CHANNEL_CONFIG.general;
        const targetChannel = client.channels.cache.get(targetChannelId);

        if (targetChannel) {
            await targetChannel.send({ embeds: [successEmbed] });
        }

        await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
        console.error('Sourcing request failed:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ 소싱 요청 실패')
            .setDescription('상품 분석 중 오류가 발생했습니다.')
            .addFields({ name: '오류 내용', value: error.response?.data?.message || error.message })
            .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

async function handleSourcingInquiry(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const requestId = interaction.options.getString('요청id');
    const userId = interaction.user.id;

    try {
        // If no specific request ID, show user's recent requests
        if (!requestId) {
            const historyEmbed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('📋 최근 소싱 요청')
                .setDescription('최근 5개의 소싱 요청 내역입니다.')
                .addFields(
                    { name: '요청 1', value: '상품명: 예시 상품 1\n상태: 분석 완료\n일시: 2024-01-01', inline: true },
                    { name: '요청 2', value: '상품명: 예시 상품 2\n상태: 등록 완료\n일시: 2024-01-02', inline: true },
                    { name: '요청 3', value: '상품명: 예시 상품 3\n상태: 진행 중\n일시: 2024-01-03', inline: true }
                )
                .setFooter({ text: '특정 요청을 조회하려면 요청ID를 입력하세요.' })
                .setTimestamp();

            return await interaction.editReply({ embeds: [historyEmbed] });
        }

        // Query specific request
        const statusEmbed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('🔍 소싱 요청 상태')
            .setDescription(`요청 ID: ${requestId}`)
            .addFields(
                { name: '상품명', value: '예시 상품', inline: true },
                { name: '현재 상태', value: '✅ 등록 완료', inline: true },
                { name: '등록 플랫폼', value: '쿠팡 윙', inline: true },
                { name: '등록 URL', value: '[상품 페이지 보기](https://www.coupang.com/vp/products/123456)', inline: false }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [statusEmbed] });

    } catch (error) {
        console.error('Inquiry failed:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ 조회 실패')
            .setDescription('요청 조회 중 오류가 발생했습니다.')
            .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

async function handleSourcingCancel(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const requestId = interaction.options.getString('요청id');

    try {
        // Mock cancellation
        const cancelEmbed = new EmbedBuilder()
            .setColor('#FF9900')
            .setTitle('⚠️ 소싱 요청 취소')
            .setDescription(`요청 ID: ${requestId}`)
            .addFields(
                { name: '취소 상태', value: '✅ 성공적으로 취소되었습니다.', inline: false },
                { name: '취소 시간', value: new Date().toLocaleString('ko-KR'), inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [cancelEmbed] });

    } catch (error) {
        console.error('Cancellation failed:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ 취소 실패')
            .setDescription('요청 취소 중 오류가 발생했습니다.')
            .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

async function handleSourcingTemplate(interaction) {
    const templateEmbed = new EmbedBuilder()
        .setColor('#9932CC')
        .setTitle('📋 소싱 요청 템플릿')
        .setDescription('효율적인 소싱 요청을 위한 가이드입니다.')
        .addFields(
            { 
                name: '1️⃣ 기본 소싱 요청', 
                value: '```/소싱요청 url:https://도매꾹URL 플랫폼:wing 목표마진율:30```', 
                inline: false 
            },
            { 
                name: '2️⃣ 높은 마진 요청', 
                value: '```/소싱요청 url:https://도매꾹URL 플랫폼:rocket 목표마진율:50```', 
                inline: false 
            },
            { 
                name: '3️⃣ 위탁 판매 요청', 
                value: '```/소싱요청 url:https://도매꾹URL 플랫폼:consignment 목표마진율:25```', 
                inline: false 
            },
            { 
                name: '💡 팁', 
                value: '• URL은 도매꾹 상품 페이지 주소를 정확히 입력하세요\n• 목표마진율은 10-100% 범위에서 설정 가능합니다\n• 플랫폼별로 수수료가 다르니 참고하세요', 
                inline: false 
            }
        )
        .setFooter({ text: 'Selpix v1.5 - AI 기반 커머스 자동화' })
        .setTimestamp();

    await interaction.reply({ embeds: [templateEmbed], ephemeral: true });
}

async function handleHelp(interaction) {
    const helpEmbed = new EmbedBuilder()
        .setColor('#4169E1')
        .setTitle('🤖 Selpix Bot 도움말')
        .setDescription('AI 기반 커머스 자동화 플랫폼 Selpix의 Discord Bot입니다.')
        .addFields(
            { 
                name: '📝 주요 명령어', 
                value: '`/소싱요청` - 새 상품 소싱 요청\n`/소싱조회` - 요청 상태 확인\n`/소싱취소` - 요청 취소\n`/소싱템플릿` - 요청 템플릿 보기\n`/도움말` - 이 도움말 표시', 
                inline: false 
            },
            { 
                name: '🔄 자동화 프로세스', 
                value: '1. 도매꾹 상품 분석\n2. 마진 계산 및 가격 추천\n3. AI 키워드 생성 (20개)\n4. 쿠팡 검색 링크 생성\n5. 자동 등록 (선택시)', 
                inline: true 
            },
            { 
                name: '📊 지원 플랫폼', 
                value: '• 쿠팡 로켓배송\n• 쿠팡 위탁판매\n• 쿠팡 윙', 
                inline: true 
            },
            { 
                name: '⚡ 성능 목표', 
                value: '• 전체 프로세스 3분 내 완료\n• 키워드 생성 정확도 90%+\n• 마진 계산 오차 5% 이내', 
                inline: false 
            },
            { 
                name: '🆘 지원', 
                value: '문제가 발생하면 관리자에게 문의하거나\n[웹 대시보드](https://selpix.com)를 이용하세요.', 
                inline: false 
            }
        )
        .setThumbnail('https://cdn.discordapp.com/attachments/123456789/selpix-logo.png')
        .setFooter({ text: 'Selpix v1.5 - Powered by AI' })
        .setTimestamp();

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
}

// Utility Functions
function isValidUrl(string) {
    try {
        new URL(string);
        return string.includes('도매꾹') || string.includes('domeggook') || true; // Mock validation
    } catch (_) {
        return false;
    }
}

function getPlatformName(platform) {
    const platformNames = {
        rocket: '🚀 쿠팡 로켓배송',
        consignment: '📦 쿠팡 위탁판매',
        wing: '🛩️ 쿠팡 윙'
    };
    return platformNames[platform] || '❓ 알 수 없음';
}

// Error Handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Start Bot
client.login(process.env.DISCORD_BOT_TOKEN);

console.log('Selpix Discord Bot starting...');

module.exports = client;
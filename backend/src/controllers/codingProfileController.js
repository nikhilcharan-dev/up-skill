import CodingProfile from '../models/CodingProfile.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const LC_API = 'https://leetcode.com/graphql/';
const CF_API = 'https://codeforces.com/api/user.info?handles=';

const GQLQuery = `
    query userCombinedInfo($username: String!) {
        allQuestionsCount {
            difficulty
            count
        }
        matchedUser(username: $username) {
            username
            profile {
                ranking
                userAvatar
                realName
                aboutMe
                school
                skillTags
                reputation
                reputationDiff
                countryName
            }
            badges {
                id
                name
                displayName
                icon
            }
            upcomingBadges {
                name
                icon
                progress
            }
            submitStats: submitStatsGlobal {
                acSubmissionNum {
                    difficulty
                    count
                    submissions
                }
                totalSubmissionNum {
                    difficulty
                    count
                    submissions
                }
            }
        }
        userContestRanking(username: $username) {
            attendedContestsCount
            rating
            globalRanking
            totalParticipants
            topPercentage
            badge {
                name
            }
        }
    }
`;

export const getCodingProfile = async (req, res) => {
    try {
        // Support both admin (params) and trainee (auth token) access
        const userId = req.params.userId || req.user.id;
        const profile = await CodingProfile.findOne({ user: userId });

        let leetcodeData = null;
        if (profile && profile.leetcode) {
            try {
                const handle = profile.leetcode.trim();
                const gqlVariables = { username: handle };

                const lcResponse = await axios.post(
                    LC_API,
                    { query: GQLQuery, variables: gqlVariables },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                            'Accept': 'application/json'
                        }
                    }
                );

                const data = lcResponse.data?.data;
                if (data && data.matchedUser) {
                    const user = data.matchedUser;
                    const userProfile = user.profile || {};
                    const contest = data.userContestRanking || {};
                    const submitStats = user.submitStats?.acSubmissionNum || [];
                    const totalStats = data.allQuestionsCount || [];

                    // Helper to find count by difficulty
                    const getCount = (arr, diff) => arr.find(i => i.difficulty === diff)?.count || 0;

                    leetcodeData = {
                        username: user.username,
                        name: userProfile.realName || user.username,
                        avatar: userProfile.userAvatar,
                        ranking: userProfile.ranking || 0,
                        reputation: userProfile.reputation || 0,
                        country: userProfile.countryName,
                        skillTags: userProfile.skillTags || [],
                        about: userProfile.aboutMe,
                        school: userProfile.school,
                        badges: user.badges || [],

                        // Solved Stats
                        solved: {
                            all: getCount(submitStats, 'All'),
                            easy: getCount(submitStats, 'Easy'),
                            medium: getCount(submitStats, 'Medium'),
                            hard: getCount(submitStats, 'Hard')
                        },
                        // Total Questions Available
                        total: {
                            all: getCount(totalStats, 'All'),
                            easy: getCount(totalStats, 'Easy'),
                            medium: getCount(totalStats, 'Medium'),
                            hard: getCount(totalStats, 'Hard')
                        },

                        // Contest
                        contest: {
                            rating: Math.round(contest.rating) || 0,
                            globalRanking: contest.globalRanking || 0,
                            topPercentage: contest.topPercentage || 0,
                            attended: contest.attendedContestsCount || 0
                        }
                    };
                }
            } catch (error) {
                console.error('Error fetching LeetCode GraphQL data:', error.message);
                if (error.response) {
                    console.error('GraphQL Error Status:', error.response.status);
                    console.error('GraphQL Error Data:', JSON.stringify(error.response.data));
                }
            }
        }

        let codeforcesData = null;
        if (profile && profile.codeforces) {
            try {
                const handle = profile.codeforces.trim();
                const cfResponse = await axios.get(`${CF_API}${handle}`);

                if (cfResponse.data.status === 'OK' && cfResponse.data.result.length > 0) {
                    const user = cfResponse.data.result[0];
                    codeforcesData = {
                        username: user.handle,
                        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.handle,
                        avatar: user.avatar,
                        rating: user.rating || 0,
                        rank: user.rank || 'Unrated',
                        maxRating: user.maxRating || 0,
                        maxRank: user.maxRank || 'Unrated',
                        lastOnline: user.lastOnlineTimeSeconds,
                        registrationTime: user.registrationTimeSeconds,
                        friendOfCount: user.friendOfCount || 0,
                        titlePhoto: user.titlePhoto
                    };
                }
            } catch (error) {
                console.error('Error fetching CodeForces data:', error.message);
            }
        }

        let codechefData = null;
        if (profile && profile.codechef) {
            try {
                const handle = profile.codechef.trim();
                const ccResponse = await axios.get(`https://www.codechef.com/users/${handle}`);

                if (ccResponse.status === 200) {
                    const $ = cheerio.load(ccResponse.data);

                    const name = $('h1.h2-style').text().trim() || handle;
                    const avatar = $('header.sidebar-header img').attr('src') || $('.user-details-container img').attr('src');
                    const rating = parseInt($('.rating-number').text().replace(/\D/g, '')) || 0;
                    const maxRating = parseInt($('small').text().match(/Highest Rating (\d+)/)?.[1]) || 0;

                    const globalRank = parseInt($('.rating-ranks ul li').filter((_, el) => $(el).text().includes('Global Rank')).find('strong').text()) || 0;
                    const countryRank = parseInt($('.rating-ranks ul li').filter((_, el) => $(el).text().includes('Country Rank')).find('strong').text()) || 0;

                    // Star Rating: Count number of spans with background color inside .rating-star
                    let stars = $('.rating-star span').length;
                    if (stars === 0) {
                        // Fallback attempts
                        const starText = $('.rating-star').text().trim(); // sometimes it's text like "1★"
                        if (starText) stars = starText;
                    } else {
                        stars = `${stars}★`;
                    }

                    // Country
                    const countryFlag = $('.user-country-flag').attr('src') || '';
                    const countryName = $('.user-country-name').text().trim();

                    codechefData = {
                        username: handle,
                        name,
                        avatar,
                        rating,
                        maxRating,
                        globalRank,
                        countryRank,
                        stars,
                        countryFlag,
                        countryName
                    };
                }
            } catch (error) {
                console.error('Error fetching CodeChef data:', error.message);
            }
        }


        if (!profile) {
            return res.json({
                leetcode: '',
                codeforces: '',
                codechef: '',
                hackerrank: '',
                leetcodeData: null,
                codeforcesData: null
            });
        }

        const profileObj = profile.toObject();
        profileObj.leetcodeData = leetcodeData;
        profileObj.codeforcesData = codeforcesData;
        profileObj.codechefData = codechefData;

        res.json(profileObj);
    } catch (err) {
        console.error("getCodingProfile Controller Error:", err);
        res.status(500).json({ msg: err.message });
    }
};

export const updateCodingProfile = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        const { leetcode, codeforces, codechef, hackerrank } = req.body;

        let profile = await CodingProfile.findOne({ user: userId });

        if (profile) {
            profile.leetcode = leetcode;
            profile.codeforces = codeforces;
            profile.codechef = codechef;
            profile.hackerrank = hackerrank;
            profile.lastUpdated = Date.now();
            await profile.save();
        } else {
            profile = new CodingProfile({
                user: userId,
                leetcode,
                codeforces,
                codechef,
                hackerrank
            });
            await profile.save();
        }

        res.json(profile);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

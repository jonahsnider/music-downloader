#! /usr/bin/env node

const signale = require('signale');
const { join } = require('path');
const lineByLine = require('linebyline');
const ytdl = require('ytdl-core');
const { lstatSync, existsSync, createWriteStream } = require('fs');
const { prompt } = require('inquirer');

signale.start('music-downloader started');

// Path to put default search area for file selection
const userHomePath = require('os').homedir();

const prompts = [{
  'type': 'input',
  'name': 'urlList',
  // Only allow non-directories and text files
  'validate': input => lstatSync(input).isFile(),
  'message': 'Select a text file to load videos from (1 video per line):',
  'default': join(userHomePath, 'videos.txt')
},
{
  'type': 'input',
  'name': 'resultDir',
  // Only allow directories
  'validate': input => lstatSync(input).isDirectory(),
  'message': 'Select a directory to store downloaded audio to:',
  'default': join(userHomePath, 'Music')
}];

/**
 * @author Jdender <jdenderplays@gmail.com>
 * @param {string} resultDir Directory to save the video to
 * @param {string} videoID Directory to save the video to
 * @return {null|stream.Readable}
 */
const downloadVideo = resultDir => async videoID => {
  // Get data for determining title of file
  const data = await ytdl.getBasicInfo(videoID);

  // Display name will be the video title if the given video doesn't have media metadata
  const displayName = typeof data.videoDetails.media.song === 'string' ? data.videoDetails.media.song : data.videoDetails.title;

  // Initialize a logger for this video using the display name
  const videoLogger = signale.scope(displayName);

  // Full file path for the audio file
  const filePath = join(resultDir, `${displayName}.mp3`);

  // Skip over pre-existing files
  if (existsSync(filePath)) return videoLogger.warn('File already exists, skipping');

  // Get an audio-only ReadableStream
  const stream = ytdl(videoID, {
    quality: 'highestaudio',
    filter: 'audioonly'
  });

  // Set up event handlers before calling the pipe function
  stream
    .on('error', err => videoLogger.error(err))
    // This event is triggered when the stream starts getting piped somewhere
    .on('pipe', () =>
      videoLogger.await({
        prefix: '[1/2]',
        message: 'Downloading...'
      }))
    // This event is triggered when the stream has finished being flushed to the file system
    .on('finish', () =>
      videoLogger.success({
        prefix: '[2/2]',
        message: `Downloaded video to ${filePath}`
      }));

  // Start piping the audio stream from YouTube to the file path
  return stream.pipe(createWriteStream(filePath));
};

/**
 * @author Jdender~ <jdenderplays@gmail.com>
 * @param {Object} params Result from Inquirer
 */
const getVideoList = params => {
  // Empty validated array of video IDs
  let videos = [];

  // Start reading every line in the provided videos file
  lineByLine(params.urlList)
    // Each line read triggers this event
    .on('line', (videoIdResolvable, lineCount) => {
      // Check if the video ID resolvable is valid
      if (ytdl.validateURL(videoIdResolvable) || ytdl.validateID(videoIdResolvable)) {
        // Add the ID for the video to the array
        videos.push(ytdl.getVideoID(videoIdResolvable));
      } else {
        // Alert the user that the video ID resolvable provided was invalid
        signale.error(`Line ${lineCount} (${videoIdResolvable}) is an invalid YouTube video`);
      }
    })
    // When all lines have been read this event is triggered
    .on('end', () => {
      // Remove duplicate unique video IDs
      videos = videos.filter((elem, pos) => videos.indexOf(elem) === pos);

      signale.info(`${videos.length} videos to download`);

      // Use currying to pass in result directory now
      const downloadToDir = downloadVideo(params.resultDir);

      // Use currying to pass in video resolvable
      videos.forEach(downloadToDir);
    })
    .on('error', err => signale.error('Error encountered while attempting to read in settings', err));
};

prompt(prompts)
  .then(getVideoList)
  .catch(err => signale.error('Error encountered while getting parameters from Inquirer', err));

path = require 'path'
fs = require 'fs'

module.exports =
  getNvccFlags: (fileName) ->
    return getNvccFlagsDotNvccComplete(fileName)
  activate: (state) ->

getFileContents = (startFile, fileName) ->
  searchDir = path.dirname startFile
  while searchDir
    searchFilePath = path.join searchDir, fileName
    try
      searchFileStats = fs.statSync searchFilePath
      if searchFileStats.isFile()
        try
          contents = fs.readFileSync searchFilePath, 'utf8'
          return [searchDir, contents]
        catch error
          console.log "nvcc-flags for " + fileName + " couldn't read file " + searchFilePath
          console.log error
        return [null, null]
    parentDir = path.dirname searchDir
    break if parentDir == searchDir
    searchDir = parentDir
  return [null, null]

getNvccFlagsDotNvccComplete = (fileName) ->
  [searchDir, nvccCompleteContents] = getFileContents(fileName, ".nvcc_complete")
  args = []
  if nvccCompleteContents != null && nvccCompleteContents.length > 0
    args = nvccCompleteContents.trim().split("\n")
  return [args, searchDir]

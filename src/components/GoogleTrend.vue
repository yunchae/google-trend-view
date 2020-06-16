<template>
  <div class="main">
    <div class="keywords">
      <div class="keywords-title">Keywords : </div>
      <vue-tags-input
              v-model="tag"
              :tags="tags"
              @tags-changed="newTags => tags = newTags"
      />
    </div>
    <div class="options">
      <div class="title2" style="font-size: 20px; font-weight: bolder"> OPTIONS </div>
      <div class="interval">
        <div class="title2">検索インターバル</div>
        <input type="number" v-model="search.interval.min" min="0" max="60" placeholder="0">
        <div>分</div>
        <input type="number" v-model="search.interval.sec" min="0" max="59" placeholder="5">
        <div>秒</div>
      </div>

      <div class="repeat-count">
        <div class="title2">反復回数</div>
        <input type="number" v-model="search.repeatCount" min="1" max="10" placeholder="5">
        <div>回</div>
      </div>
      <div>
        <hr style="width: 1000px;">
      </div>
      <div class="past">
        <input type="radio" name="dateType" v-model="search.usePast" v-bind:value=true>
        <div class="title">「 過去 」</div>
        <input type="number" v-model="search.before.year" min="0" max="4" placeholder="1" :disabled="!search.usePast">
        <div>年</div>
        <input type="number" v-model="search.before.month" min="0" max="12" placeholder="3" :disabled="!search.usePast">
        <div>月</div>
        <input type="number" v-model="search.before.day" min="0" max="31" placeholder="12" :disabled="!search.usePast">
        <div>日前から 今日まで</div>
      </div>
      <div class="select">
        <input type="radio" name="dateType" v-model="search.usePast" v-bind:value=false checked="checked">
        <div class="title">「 DATE 」</div>
        <input type="number" v-model="search.startDate.year" min="1000" max="9999" placeholder="2020" :disabled="search.usePast">
        <div>年</div>
        <input type="number" v-model="search.startDate.month" min="1" max="12" placeholder="1" :disabled="search.usePast">
        <div>月</div>
        <input type="number" v-model="search.startDate.day" min="1" max="31" placeholder="2" :disabled="search.usePast">
        <div>日</div>
        <div> から </div>
        <input type="number" v-model="search.endDate.year" min="1000" max="9999" placeholder="2020" :disabled="search.usePast">
        <div>年</div>
        <input type="number" v-model="search.endDate.month" min="1" max="12" placeholder="3" :disabled="search.usePast">
        <div>月</div>
        <input type="number" v-model="search.endDate.day" min="1" maxlength="31" placeholder="13" :disabled="search.usePast">
        <div>日まで</div>
      </div>
    </div>
    <button class="click" @click="searches" :disabled="disabledButton"> Download Excel </button>
    <loading :active.sync="isLoading"
             :can-cancel="false"
             :is-full-page="fullPage"></loading>
  </div>
</template>

<script>

import VueTagsInput from '@johmun/vue-tags-input';
// Import component
import Loading from 'vue-loading-overlay';
// Import stylesheet
import 'vue-loading-overlay/dist/vue-loading.css';

export default {
  name: 'GoogleTrend',
  components: {
    VueTagsInput,
    Loading
  },
  computed: {
    disabledButton: function() {
      if (this.tags.length < 1) return true
      if (this.getInterval < 1) return true
      if (this.search.repeatCount < 1) return true
      if (this.search.usePast && (this.search.before.year === "" &&
                                  this.search.before.month === "" &&
                                  this.search.before.day === "")) return true
      if (!this.search.usePast && (this.search.startDate.year === "" ||
                                   this.search.startDate.month === "" ||
                                   this.search.startDate.day === "" ||
                                   this.search.endDate.year === "" ||
                                   this.search.endDate.month === "" ||
                                   this.search.endDate.day === "")) return true
      return false
    },
    getInterval: function() {
      return (this.search.interval.min * 60 + this.search.interval.sec) * 1000
    },
    isDaily: function() {
      let startDate = ''
      let endDate = ''

      if (this.search.before.year || this.search.before.month || this.search.before.day) {
          startDate = this.makePastStartDate()
          endDate   = this.search.before.endDate
      } else {
        startDate = this.makeDate(this.search.startDate)
        endDate   = this.makeDate(this.search.endDate)
      }

      return (endDate-startDate)/(24*60*60*1000) < 270
    },
    bodyParams: function () {
      return {
        keywords: this.tags.map(item => item.text),
        startdate: [
          this.search.usePast ? this.search.before.startDate.getFullYear() : this.search.startDate.year,
          this.search.usePast ? this.search.before.startDate.getMonth() + 1 : this.search.startDate.month,
          this.search.usePast ? this.search.before.startDate.getDate() : this.search.startDate.day,
        ].join("."),
        enddate: [
          this.search.usePast ? this.search.before.endDate.getFullYear() : this.search.endDate.year,
          this.search.usePast ? this.search.before.endDate.getMonth() + 1 : this.search.endDate.month,
          this.search.usePast ? this.search.before.endDate.getDate() : this.search.endDate.day,
        ].join(".")
      }
    }
  },
  data: function () {
    return {
      tag: '',
      tags: [],
      WEEK: 37,
      search: {
        interval: {
          min: 0,
          sec: 5
        },
        repeatCount: 5,
        usePast: false,
        startDate: {
          year: '',
          month: '',
          day: ''
        },
        endDate: {
          year: '',
          month: '',
          day: ''
        },
        before: {
          year: '',
          month: '',
          day: '',
          startDate: {},
          endDate: {}
        }
      },
      isLoading: false,
      fullPage: true
    }
  },
  methods: {
    sleep: function() {
      return new Promise(resolve => setTimeout(resolve, this.getInterval))
    },
    makeTodayDate: function() {
      const date = this.$moment().toDate()
      date.setHours(23,0,0)
      return date
    },
    makePastStartDate: function() {
      const startDate = this.makeTodayDate()

      if (this.search.before.year > 0 ) startDate.setFullYear(startDate.getFullYear() - this.search.before.year)
      if (this.search.before.month > 0 ) startDate.setMonth(startDate.getMonth() - this.search.before.month)
      if (this.search.before.day > 0 ) startDate.setDate(startDate.getDate() - this.search.before.day)

      this.search.before.startDate = startDate
      return startDate
    },
    makeDate: function (date) {
      const moment = this.$moment().toDate()
      moment.setFullYear(date.year || date[0])
      moment.setMonth(parseInt(date.month || date[1]) - 1)
      moment.setDate(date.day || date[2])
      moment.setHours(23,0,0)
      return moment
    },
    searches: async function() {
        this.isLoading = true
        if (this.isDaily) {
           const daily = await this.dailySearch(this.bodyParams)
           this.downloadDaily(daily)
        } else {
          const searchResult = await this.$axios.post('https://boiling-crag-00492.herokuapp.com/weekly-search', this.bodyParams)
          // const searchResult = await this.$axios.post('http://localhost:3000/weekly-search', this.bodyParams)
          const weeklyData = searchResult.data
          const DAILY_SEARCH_COUNT = Math.floor(weeklyData.length / this.WEEK)

          let afterResult = []
          const rawResult = []
          for(let i = 0; i < DAILY_SEARCH_COUNT; i++) {
            let week37data = weeklyData.splice(0, this.WEEK)
            let day37data = await this.convertWeeklyToDaily(week37data,
                    weeklyData.length % this.WEEK === 0 && i === DAILY_SEARCH_COUNT - 1 ? this.bodyParams.endDate : '',
                    i === 0 ? this.bodyParams.startDate: '');
            afterResult = afterResult.concat(day37data)
            rawResult.push({ week37data: week37data, day37data})
          }

          if (weeklyData.length % this.WEEK > 0) {
            let day37data = await this.convertWeeklyToDaily(weeklyData, this.bodyParams.endDate);
            afterResult = afterResult.concat(day37data)
            rawResult.push({ week37data: weeklyData, day37data})
          }
          this.downloadWeeky(afterResult, rawResult)
        }
    },
    dailySearch: async function(params) {
      const resultList = []
      let rawList = []
      for (let i = 0; i < this.search.repeatCount; i++) {
        const searchResult = await this.$axios.post('https://boiling-crag-00492.herokuapp.com/daily-search', params)
        // const searchResult = await this.$axios.post('http://localhost:3000/daily-search', params)
        resultList.push(searchResult.data)
        rawList.push(searchResult.data)
        await this.sleep()
      }
      const resultLength = resultList[0].length
      if (resultLength > 0) {
        for (let i = 0; i < resultLength; i++) {
          for (let j = 1; j < this.search.repeatCount; j++) {
            resultList[0][i].formattedValue += resultList[j][i].formattedValue
          }
          resultList[0][i].formattedValue /= this.search.repeatCount
        }
      }

      if (this.isDaily) {
        return {resultList: resultList[0], rawList}
      } else {
        return resultList[0]
      }
    },
    convertWeeklyToDaily: async function (week37data, endDate, startDate) {
      let max = 0
      let date = ''

      week37data.forEach(item => {
        if (item.formattedValue > max) {
          max = item.formattedValue
          date = item.formattedAxisTime
        }
      })

      const startAxisTime = week37data[0].formattedAxisTime.split('/').join('.')

      let endAxisTime = this.makeDate(week37data[week37data.length - 1].formattedAxisTime.split('/'))
      endAxisTime.setDate(endAxisTime.getDate() + 6)
      endAxisTime = [endAxisTime.getFullYear(), endAxisTime.getMonth() + 1, endAxisTime.getDate()].join('.')

      const params = {
        keywords: this.tags.map(item => item.text),
        startdate: startDate || startAxisTime,
        enddate: endDate || endAxisTime
      }

      let day37data = await this.dailySearch(params)
      let valueFound = 0

      day37data.some(item => {
        if (date === item.formattedTime) {
          valueFound = item.formattedValue
          return true
        }
        return false
      })

      return day37data.map(item => {
        item.formattedValue *= max / valueFound
        return item
      })
    },
    downloadDaily: function(excelData) {
      const excel = excelData.resultList.map( item => {
        return {
          "期間": item.formattedTime,
          "スコア": item.formattedValue
        }
      })

      const wb = this.$xlsx.utils.book_new()
      const ws = this.$xlsx.utils.json_to_sheet(excel)
      this.$xlsx.utils.book_append_sheet(wb, ws, this.bodyParams.keywords)

      for (let i = 0; i < excelData.rawList.length; i ++) {
          const rawData = excelData.rawList[i].map( item => {
            return {
              "期間": item.formattedTime,
              "スコア": item.formattedValue
            }
          })

          const ws = this.$xlsx.utils.json_to_sheet(rawData)
          this.$xlsx.utils.book_append_sheet(wb, ws, i + 1 + '')
      }

      this.$xlsx.writeFile(wb,
              `GT(${this.bodyParams.keywords.join(',')})_${this.bodyParams.startdate}~${this.bodyParams.enddate}_interval(${this.getInterval/1000})_repeat(${this.search.repeatCount}).xlsx`)
      this.isLoading = false
    },
    downloadWeeky: function(excelData, rawData) {
      const excel = excelData.map( item => {
        return {
          "期間": item.formattedTime,
          "スコア": item.formattedValue
        }
      })
      const ws = this.$xlsx.utils.json_to_sheet(excel)
      const wb = this.$xlsx.utils.book_new()
      this.$xlsx.utils.book_append_sheet(wb, ws, this.bodyParams.keywords)

      for (let i = 0; i < rawData.length; i ++) {
        const week37 = rawData[i].week37data.map( item => {
          return {
            "期間": item.formattedTime,
            "スコア": item.formattedValue
          }
        })

        const ws1 = this.$xlsx.utils.json_to_sheet(week37)
        this.$xlsx.utils.book_append_sheet(wb, ws1, i + 1 + 'week37')

        const day37 = rawData[i].day37data.map( item => {
          return {
            "期間": item.formattedTime,
            "スコア": item.formattedValue
          }
        })

        const ws2 = this.$xlsx.utils.json_to_sheet(day37)
        this.$xlsx.utils.book_append_sheet(wb, ws2, i + 1 + 'day37')
      }

      this.$xlsx.writeFile(wb,
              `GT(${this.bodyParams.keywords.join(',')})_${this.bodyParams.startdate}~${this.bodyParams.enddate}_interval(${this.getInterval/1000})_repeat(${this.search.repeatCount}).xlsx`)

      this.isLoading = false
    },
  },
  mounted: function () {
    this.search.before.endDate = this.makeTodayDate()
    this.search.endDate.year = this.search.before.endDate.getFullYear()
    this.search.endDate.month = this.search.before.endDate.getMonth() + 1
    this.search.endDate.day = this.search.before.endDate.getDate()
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.main {
}

.keywords {
  display: flex;
  align-items: center;
  /*justify-content: center;*/
  margin: auto;
}

.keywords-title {
  margin-left: 10px;
  margin-right: 10px;
}

.options {
  margin-top: 40px;
}

.options div {
  float: left;
  display: inline-block;
}

.title {
  width: 100px;
}

.title2 {
  width: 142px;
  text-align: left;
  margin-left: 18px;
}

.past, .select, .interval, .repeat-count {
  width: 100%;
}

.options input {
  float: left;
  margin-right: 5px;
  margin-left: 15px;
  width: 40px;
  text-align: center;
}

.click {
  margin-top: 15px;
  width: 200px;
  height: 30px;
}

input:disabled {
  background-color: lightgrey;
}

h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
  color: lightgrey;
  opacity: 1; /* Firefox */
}

</style>

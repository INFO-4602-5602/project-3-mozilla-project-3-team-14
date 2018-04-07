

## Visualization 3
Visualization 3 is looking at the correlation between peoples biggest fears, and the amount of devices they own. Before doing any work, we expected that those who answered that they were most fearful for loss of privacy would have less devices on average. Further, people who were worried about staying in touch with people would own more devices on average. However, we found that it does not matter what someone is most fearful of in the future since on average every group owns three devices. Interestingly, the 'Loss of Privacy' group owns many more devices than the other groups. This may be because many more people answered the question for 'Loss of Privacy', thus introducing more data.

The interaction is a simple HoverTool which allows the audience to mouse over and see what number the bars lay at exactly. The preprocess took a little bit of work. The amount of devices was not previously calcualted which meant that we had to use pandas to turn this data into 1s or 0s. Pandas get_dummies function helped greatly here. Once that was calculated, we merged the new data with the old dataframe on Response ID.

The design process for this visualization was quite simple. We genereated a research question and then used Pandas to get the data into a useable format. Once that was done, I used Bokeh to create the graphs and add interactivity.

X=read.table("squared_radii.txt")

colnames(X)="radius"
X$radius=sqrt(X$radius)

# estimate density
#D=density(X$radius)
# set bandwidth to avoid having very small peaks in the density
D=density(X$radius,bw=3)

get_right_peak=function(X)
    {
        # add azero on the left
        X_pos_offset=c(0,X[-length(X)])
        # add azero on the right
        X_neg_offset=c(X[-1],0)
        # detect local maximum
        peaks=which(X>X_pos_offset && X>X_neg_offset)
        # get the rightmost peak
        return(max(which(X>X_pos_offset & X>X_neg_offset)))

    }

protein_radius=D$x[get_right_peak(D$y)]


#library(ggplot2)
# Add y=..density.. to scale to density
#ggplot(X,aes(radius))+geom_histogram(aes(y=..density..))+geom_vline(xintercept=protein_radius, col="red")+geom_density()
hist(X$radius)
plot(D$x,D$y)
abline(v=protein_radius,col="red")

protein_radius=protein_radius+1.66

Vol=scan("Volume_total.txt",what=double())
H=scan("Thickness.txt",what=double())

belt_radius=sqrt(Vol/(pi*H)+protein_radius^2)

result=data.frame(name=character(),value=numeric())
result=rbind(result,data.frame(name="protein_radius",value=protein_radius))
result=rbind(result,data.frame(name="belt_radius",value=belt_radius))

write.table(result,file="radius.txt",quote=FALSE,row.names=F, col.names=F)
